import type { FastifyPluginAsync } from "fastify";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tItem, tMerchant } from "../db/schema/index.js";

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/search", async (request) => {
    const { q, page, per_page } = z
      .object({
        q: z.string().min(1),
        page: z.coerce.number().default(1),
        per_page: z.coerce.number().default(20),
      })
      .parse(request.query);

    const offset = (page - 1) * per_page;
    const pattern = `%${q}%`;

    const [items, merchants] = await Promise.all([
      db
        .select({
          type: sql<string>`'item'`,
          id: tItem.itemId,
          name: tItem.name,
          description: tItem.desc,
          score: sql<number>`similarity(${tItem.name}, ${q})`,
        })
        .from(tItem)
        .where(sql`${tItem.name} ILIKE ${pattern}`)
        .limit(per_page)
        .offset(offset),
      db
        .select({
          type: sql<string>`'merchant'`,
          id: tMerchant.merchantId,
          name: tMerchant.name,
          description: tMerchant.description,
          score: sql<number>`similarity(${tMerchant.name}, ${q})`,
        })
        .from(tMerchant)
        .where(sql`${tMerchant.name} ILIKE ${pattern}`)
        .limit(per_page)
        .offset(offset),
    ]);

    const results = [...items, ...merchants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return { data: results, total: results.length };
  });
};

export default searchRoutes;
