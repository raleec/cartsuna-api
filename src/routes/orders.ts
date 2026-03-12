import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tOrder, tItemAvailability } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";
import { publishEvent } from "../queue/producer.js";

const createSchema = z.object({
  itemId: z.string().uuid(),
  availabilityId: z.string().uuid().optional(),
  itemCount: z.number().int().min(1).default(1),
  memo: z.string().optional(),
});

const updateSchema = z.object({
  itemCount: z.number().int().min(1).optional(),
  memo: z.string().optional(),
  state: z.string().optional(),
});

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = z
      .object({ page: z.coerce.number().default(1), per_page: z.coerce.number().default(20) })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tOrder).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tOrder),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(tOrder).where(eq(tOrder.orderId, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Order not found" });
    return row;
  });

  fastify.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);

    // Use a transaction with SELECT FOR UPDATE to prevent race condition on quota
    if (body.availabilityId) {
      const availabilityId = body.availabilityId;
      const itemCount = body.itemCount;

      const result = await db.transaction(async (tx) => {
        // Lock the row for update to ensure atomicity
        const rows = await tx.execute<{
          availability_id: string;
          quota: number | null;
          booked: number;
        }>(
          sql`SELECT availability_id, quota, booked FROM t_item_availability WHERE availability_id = ${availabilityId} FOR UPDATE`
        );
        const avail = rows.rows[0];
        if (!avail) return { error: "not_found" };
        if (avail.quota !== null && avail.booked + itemCount > avail.quota) {
          return { error: "quota_exceeded" };
        }
        await tx
          .update(tItemAvailability)
          .set({ booked: sql`${tItemAvailability.booked} + ${itemCount}` })
          .where(eq(tItemAvailability.availabilityId, availabilityId));
        return { error: null };
      });

      if (result.error === "not_found") {
        return reply.status(404).send({ error: "NotFound", message: "Availability not found" });
      }
      if (result.error === "quota_exceeded") {
        return reply
          .status(409)
          .send({ error: "Conflict", message: "Availability quota exceeded" });
      }
    }

    const [row] = await db.insert(tOrder).values(body).returning();

    await publishEvent("order.created", { orderId: row.orderId, itemId: row.itemId });

    return reply.status(201).send(row);
  });

  fastify.put("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tOrder)
      .set(body)
      .where(eq(tOrder.orderId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Order not found" });
    return row;
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.delete(tOrder).where(eq(tOrder.orderId, id)).returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Order not found" });
    return reply.status(204).send();
  });
};

export default ordersRoutes;
