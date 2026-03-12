import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tBid } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  itemId: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.number(),
  state: z.string().default("pending"),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

const updateSchema = createSchema.partial();

const bidsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = z
      .object({
        page: z.coerce.number().default(1),
        per_page: z.coerce.number().default(20),
        item_id: z.string().uuid().optional(),
      })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);
    const where = query.item_id ? eq(tBid.itemId, query.item_id) : undefined;
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tBid).where(where).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tBid).where(where),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(tBid).where(eq(tBid.bidId, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Bid not found" });
    return row;
  });

  fastify.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const [row] = await db.insert(tBid).values(body).returning();
    return reply.status(201).send(row);
  });

  fastify.put("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tBid)
      .set({ ...body, updatedTs: new Date() })
      .where(eq(tBid.bidId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Bid not found" });
    return row;
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.delete(tBid).where(eq(tBid.bidId, id)).returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Bid not found" });
    return reply.status(204).send();
  });
};

export default bidsRoutes;
