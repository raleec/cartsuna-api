import type { FastifyPluginAsync } from "fastify";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "../db/connection.js";
import { tMerchantInvite } from "../db/schema/index.js";

const BCRYPT_ROUNDS = 12;

const createInviteSchema = z.object({
  code: z.string().min(6),
  label: z.string().optional(),
  maxUses: z.number().int().optional(),
  expiresAt: z.string().datetime().optional(),
  createdBy: z.string().uuid(),
});

const updateInviteSchema = z.object({
  label: z.string().optional(),
  maxUses: z.number().int().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

const merchantInvitesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/:id/invites", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const rows = await db
      .select()
      .from(tMerchantInvite)
      .where(eq(tMerchantInvite.merchantId, id));
    return rows;
  });

  fastify.post("/:id/invites", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = createInviteSchema.parse(request.body);
    const codeHash = await bcrypt.hash(body.code, BCRYPT_ROUNDS);
    const [row] = await db
      .insert(tMerchantInvite)
      .values({
        merchantId: id,
        codeHash,
        label: body.label,
        maxUses: body.maxUses,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        createdBy: body.createdBy,
      })
      .returning();
    return reply.status(201).send(row);
  });

  fastify.patch("/:id/invites/:inviteId", async (request, reply) => {
    const { id, inviteId } = z
      .object({ id: z.string().uuid(), inviteId: z.string().uuid() })
      .parse(request.params);
    const body = updateInviteSchema.parse(request.body);
    const [row] = await db
      .update(tMerchantInvite)
      .set({
        ...body,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      })
      .where(
        and(
          eq(tMerchantInvite.merchantId, id),
          eq(tMerchantInvite.inviteId, inviteId)
        )
      )
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Invite not found" });
    return row;
  });

  fastify.delete("/:id/invites/:inviteId", async (request, reply) => {
    const { id, inviteId } = z
      .object({ id: z.string().uuid(), inviteId: z.string().uuid() })
      .parse(request.params);
    const [row] = await db
      .delete(tMerchantInvite)
      .where(
        and(
          eq(tMerchantInvite.merchantId, id),
          eq(tMerchantInvite.inviteId, inviteId)
        )
      )
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Invite not found" });
    return reply.status(204).send();
  });

  // Validate invite code for merchant access
  fastify.post("/:id/access", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { code } = z.object({ code: z.string() }).parse(request.body);
    const invites = await db
      .select()
      .from(tMerchantInvite)
      .where(and(eq(tMerchantInvite.merchantId, id), eq(tMerchantInvite.isActive, true)));

    for (const invite of invites) {
      if (invite.expiresAt && invite.expiresAt < new Date()) continue;
      if (invite.maxUses !== null && invite.useCount >= invite.maxUses) continue;
      const valid = await bcrypt.compare(code, invite.codeHash);
      if (valid) {
        // Atomically increment use_count with a WHERE guard to prevent race conditions
        const [updated] = await db
          .update(tMerchantInvite)
          .set({ useCount: sql`${tMerchantInvite.useCount} + 1` })
          .where(
            and(
              eq(tMerchantInvite.inviteId, invite.inviteId),
              sql`(${tMerchantInvite.maxUses} IS NULL OR ${tMerchantInvite.useCount} < ${tMerchantInvite.maxUses})`
            )
          )
          .returning();

        if (!updated) {
          // Another request beat us to it and exhausted quota
          continue;
        }

        // Auto-deactivate if max_uses reached
        if (updated.maxUses !== null && updated.useCount >= updated.maxUses) {
          await db
            .update(tMerchantInvite)
            .set({ isActive: false })
            .where(eq(tMerchantInvite.inviteId, invite.inviteId));
        }

        return { granted: true, inviteId: invite.inviteId };
      }
    }
    return reply.status(403).send({ error: "Forbidden", message: "Invalid or expired invite code" });
  });
};

export default merchantInvitesRoutes;
