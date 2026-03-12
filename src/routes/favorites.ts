import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tFavorite } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  customerId: z.string().uuid(),
  itemId: z.string().uuid(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

const favoritesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = z
      .object({
        page: z.coerce.number().default(1),
        per_page: z.coerce.number().default(20),
        customer_id: z.string().uuid().optional(),
      })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);
    const where = query.customer_id ? eq(tFavorite.customerId, query.customer_id) : undefined;
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tFavorite).where(where).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tFavorite).where(where),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const [row] = await db.insert(tFavorite).values(body).returning();
    return reply.status(201).send(row);
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.delete(tFavorite).where(eq(tFavorite.favoriteId, id)).returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Favorite not found" });
    return reply.status(204).send();
  });
};

export default favoritesRoutes;
