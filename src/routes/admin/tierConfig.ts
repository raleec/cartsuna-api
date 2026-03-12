import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/connection.js";
import { tTierConfig } from "../../db/schema/index.js";
import { featureFlags } from "../../config/feature-flags.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  countryCode: z.string().max(10),
  tier: z.string().max(50),
  maxCustomersPerMonth: z.number().int().optional(),
  maxOrdersPerMonth: z.number().int().optional(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

const updateSchema = createSchema.partial();

const adminTierConfigRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/tier-config", async (request, reply) => {
    if (!featureFlags.adminPortal) {
      return reply.status(404).send({ error: "NotFound", message: "Feature not enabled" });
    }
    const query = z
      .object({ page: z.coerce.number().default(1), per_page: z.coerce.number().default(20) })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tTierConfig).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tTierConfig),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.get("/tier-config/:id", async (request, reply) => {
    if (!featureFlags.adminPortal) {
      return reply.status(404).send({ error: "NotFound", message: "Feature not enabled" });
    }
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db
      .select()
      .from(tTierConfig)
      .where(eq(tTierConfig.tierConfigId, id))
      .limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "TierConfig not found" });
    return row;
  });

  fastify.post("/tier-config", async (request, reply) => {
    if (!featureFlags.adminPortal) {
      return reply.status(404).send({ error: "NotFound", message: "Feature not enabled" });
    }
    const body = createSchema.parse(request.body);
    const [row] = await db.insert(tTierConfig).values(body).returning();
    return reply.status(201).send(row);
  });

  fastify.put("/tier-config/:id", async (request, reply) => {
    if (!featureFlags.adminPortal) {
      return reply.status(404).send({ error: "NotFound", message: "Feature not enabled" });
    }
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tTierConfig)
      .set({ ...body, updatedTs: new Date() })
      .where(eq(tTierConfig.tierConfigId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "TierConfig not found" });
    return row;
  });

  fastify.delete("/tier-config/:id", async (request, reply) => {
    if (!featureFlags.adminPortal) {
      return reply.status(404).send({ error: "NotFound", message: "Feature not enabled" });
    }
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.delete(tTierConfig).where(eq(tTierConfig.tierConfigId, id)).returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "TierConfig not found" });
    return reply.status(204).send();
  });
};

export default adminTierConfigRoutes;
