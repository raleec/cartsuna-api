import type { FastifyPluginAsync } from "fastify";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tReview } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  customerId: z.string().uuid(),
  itemId: z.string().uuid(),
  merchantId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().optional(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

const updateSchema = createSchema.partial();

const reviewsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = z
      .object({
        page: z.coerce.number().default(1),
        per_page: z.coerce.number().default(20),
        item_id: z.string().uuid().optional(),
        merchant_id: z.string().uuid().optional(),
      })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);
    const conditions = [];
    if (query.item_id) conditions.push(eq(tReview.itemId, query.item_id));
    if (query.merchant_id) conditions.push(eq(tReview.merchantId, query.merchant_id));
    const where = conditions.length ? and(...conditions) : undefined;
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tReview).where(where).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tReview).where(where),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(tReview).where(eq(tReview.reviewId, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Review not found" });
    return row;
  });

  fastify.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const [row] = await db.insert(tReview).values(body).returning();
    return reply.status(201).send(row);
  });

  fastify.put("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tReview)
      .set({ ...body, updatedTs: new Date() })
      .where(eq(tReview.reviewId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Review not found" });
    return row;
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.delete(tReview).where(eq(tReview.reviewId, id)).returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Review not found" });
    return reply.status(204).send();
  });
};

export default reviewsRoutes;
