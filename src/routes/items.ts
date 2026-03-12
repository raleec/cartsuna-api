import type { FastifyPluginAsync } from "fastify";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tItem } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  merchantId: z.string().uuid(),
  inventoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  desc: z.string().optional(),
  image: z.string().optional(),
  unitPrice: z.number().optional(),
  tax: z.number().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().default("active"),
});

const updateSchema = createSchema.partial();

const itemsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = z
      .object({
        page: z.coerce.number().default(1),
        per_page: z.coerce.number().default(20),
        merchant_id: z.string().uuid().optional(),
        status: z.string().optional(),
      })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);

    const conditions = [];
    if (query.merchant_id) conditions.push(eq(tItem.merchantId, query.merchant_id));
    if (query.status) conditions.push(eq(tItem.status, query.status));
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tItem).where(where).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tItem).where(where),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(tItem).where(eq(tItem.itemId, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Item not found" });
    return row;
  });

  fastify.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const [row] = await db.insert(tItem).values(body).returning();
    return reply.status(201).send(row);
  });

  fastify.put("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tItem)
      .set(body)
      .where(eq(tItem.itemId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Item not found" });
    return row;
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.delete(tItem).where(eq(tItem.itemId, id)).returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Item not found" });
    return reply.status(204).send();
  });
};

export default itemsRoutes;
