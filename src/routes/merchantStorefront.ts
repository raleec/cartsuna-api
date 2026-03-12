import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tMerchant } from "../db/schema/index.js";

const storefrontUpdateSchema = z.object({
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  welcomeMessage: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  socialLinks: z.record(z.string()).optional(),
});

const merchantStorefrontRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/:id/storefront", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db
      .select({
        merchantId: tMerchant.merchantId,
        name: tMerchant.name,
        logoUrl: tMerchant.logoUrl,
        bannerUrl: tMerchant.bannerUrl,
        welcomeMessage: tMerchant.welcomeMessage,
        contactEmail: tMerchant.contactEmail,
        contactPhone: tMerchant.contactPhone,
        websiteUrl: tMerchant.websiteUrl,
        socialLinks: tMerchant.socialLinks,
        description: tMerchant.description,
      })
      .from(tMerchant)
      .where(eq(tMerchant.merchantId, id))
      .limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Merchant not found" });
    return row;
  });

  fastify.put("/:id/storefront", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = storefrontUpdateSchema.parse(request.body);
    const [row] = await db
      .update(tMerchant)
      .set({ ...body, updatedTs: new Date() })
      .where(eq(tMerchant.merchantId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Merchant not found" });
    return row;
  });
};

export default merchantStorefrontRoutes;
