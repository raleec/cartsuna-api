import type { FastifyPluginAsync } from "fastify";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tItem, tMerchant } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  // Search is public — no auth required
  fastify.get("/search", async (request) => {
    const { q, type, page, per_page } = z
      .object({
        q: z.string().min(1),
        type: z.enum(["all", "items", "merchants"]).default("all"),
        page: z.coerce.number().default(1),
        per_page: z.coerce.number().default(20),
      })
      .parse(request.query);

    const offset = pageToOffset(page, per_page);
    const SIMILARITY_THRESHOLD = 0.1;

    const [items, merchants] = await Promise.all([
      type === "merchants"
        ? []
        : db
            .select({
              type: sql<string>`'item'`,
              id: tItem.itemId,
              name: tItem.name,
              description: tItem.desc,
              score: sql<number>`similarity(${tItem.name}, ${q})`,
            })
            .from(tItem)
            .where(sql`similarity(${tItem.name}, ${q}) > ${SIMILARITY_THRESHOLD}`)
            .orderBy(sql`similarity(${tItem.name}, ${q}) DESC`)
            .limit(per_page)
            .offset(offset),
      type === "items"
        ? []
        : db
            .select({
              type: sql<string>`'merchant'`,
              id: tMerchant.merchantId,
              name: tMerchant.name,
              description: tMerchant.description,
              score: sql<number>`similarity(${tMerchant.name}, ${q})`,
            })
            .from(tMerchant)
            .where(sql`similarity(${tMerchant.name}, ${q}) > ${SIMILARITY_THRESHOLD}`)
            .orderBy(sql`similarity(${tMerchant.name}, ${q}) DESC`)
            .limit(per_page)
            .offset(offset),
    ]);

    const results = [...items, ...merchants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const total = results.length;

    return {
      data: results,
      pagination: buildPagination(page, per_page, total),
    };
  });
};

export default searchRoutes;
