import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tMerchant } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  location: z.string().optional(),
  schedule: z.string().optional(),
  quota: z.number().int().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  welcomeMessage: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  socialLinks: z.record(z.string()).optional(),
  isPrivate: z.boolean().default(false),
  tier: z.string().optional(),
  countryCode: z.string().max(10).optional(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

const updateSchema = createSchema.partial();

const merchantsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = z
      .object({ page: z.coerce.number().default(1), per_page: z.coerce.number().default(20) })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tMerchant).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tMerchant),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(tMerchant).where(eq(tMerchant.merchantId, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Merchant not found" });
    return row;
  });

  fastify.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const [row] = await db.insert(tMerchant).values(body).returning();
    return reply.status(201).send(row);
  });

  fastify.put("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tMerchant)
      .set({ ...body, updatedTs: new Date() })
      .where(eq(tMerchant.merchantId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Merchant not found" });
    return row;
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.delete(tMerchant).where(eq(tMerchant.merchantId, id)).returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Merchant not found" });
    return reply.status(204).send();
  });
};

export default merchantsRoutes;
