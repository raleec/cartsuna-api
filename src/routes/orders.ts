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

    let newOrder: typeof tOrder.$inferSelect;

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
        if (!avail) return { error: "not_found" as const, order: null };
        if (avail.quota !== null && avail.booked + itemCount > avail.quota) {
          return { error: "quota_exceeded" as const, order: null };
        }
        await tx
          .update(tItemAvailability)
          .set({ booked: sql`${tItemAvailability.booked} + ${itemCount}` })
          .where(eq(tItemAvailability.availabilityId, availabilityId));
        const [inserted] = await tx.insert(tOrder).values(body).returning();
        return { error: null, order: inserted };
      });

      if (result.error === "not_found") {
        return reply.status(404).send({ error: "NotFound", message: "Availability not found" });
      }
      if (result.error === "quota_exceeded") {
        return reply
          .status(409)
          .send({ error: "Conflict", message: "Availability quota exceeded" });
      }
      newOrder = result.order!;
    } else {
      const [inserted] = await db.insert(tOrder).values(body).returning();
      newOrder = inserted;
    }

    try {
      await publishEvent("order.created", { orderId: newOrder.orderId, itemId: newOrder.itemId });
    } catch (err) {
      request.log.error({ err }, "Failed to publish order.created event");
    }

    return reply.status(201).send(newOrder);
  });

  fastify.put("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);

    // If itemCount is being updated, adjust the availability booked count atomically
    if (body.itemCount !== undefined) {
      const result = await db.transaction(async (tx) => {
        const [existing] = await tx.select().from(tOrder).where(eq(tOrder.orderId, id)).limit(1);
        if (!existing) return { error: "not_found" as const, order: null };

        if (existing.availabilityId && body.itemCount !== undefined) {
          const delta = body.itemCount - existing.itemCount;
          if (delta !== 0) {
            const rows = await tx.execute<{ quota: number | null; booked: number }>(
              sql`SELECT quota, booked FROM t_item_availability WHERE availability_id = ${existing.availabilityId} FOR UPDATE`
            );
            const avail = rows.rows[0];
            if (avail) {
              if (delta > 0 && avail.quota !== null && avail.booked + delta > avail.quota) {
                return { error: "quota_exceeded" as const, order: null };
              }
              await tx
                .update(tItemAvailability)
                .set({ booked: sql`${tItemAvailability.booked} + ${delta}` })
                .where(eq(tItemAvailability.availabilityId, existing.availabilityId));
            }
          }
        }

        const [updated] = await tx.update(tOrder).set(body).where(eq(tOrder.orderId, id)).returning();
        return { error: null, order: updated };
      });

      if (result.error === "not_found") {
        return reply.status(404).send({ error: "NotFound", message: "Order not found" });
      }
      if (result.error === "quota_exceeded") {
        return reply.status(409).send({ error: "Conflict", message: "Availability quota exceeded" });
      }

      try {
        await publishEvent("order.updated", { orderId: id, state: result.order?.state });
      } catch (err) {
        request.log.error({ err }, "Failed to publish order.updated event");
      }

      return result.order;
    }

    const [row] = await db.update(tOrder).set(body).where(eq(tOrder.orderId, id)).returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Order not found" });

    try {
      await publishEvent("order.updated", { orderId: id, state: row.state });
    } catch (err) {
      request.log.error({ err }, "Failed to publish order.updated event");
    }

    return row;
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    await db.transaction(async (tx) => {
      const [row] = await tx.select().from(tOrder).where(eq(tOrder.orderId, id)).limit(1);
      if (!row) {
        await reply.status(404).send({ error: "NotFound", message: "Order not found" });
        return;
      }

      // Decrement booked count on availability slot if present
      if (row.availabilityId) {
        await tx
          .update(tItemAvailability)
          .set({ booked: sql`GREATEST(0, ${tItemAvailability.booked} - ${row.itemCount})` })
          .where(eq(tItemAvailability.availabilityId, row.availabilityId));
      }

      await tx.delete(tOrder).where(eq(tOrder.orderId, id));

      try {
        await publishEvent("order.cancelled", {
          orderId: id,
          availabilityId: row.availabilityId,
          itemCount: row.itemCount,
        });
      } catch (err) {
        request.log.error({ err }, "Failed to publish order.cancelled event");
      }
    });

    return reply.status(204).send();
  });
};

export default ordersRoutes;
