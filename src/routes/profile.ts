import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tUser } from "../db/schema/index.js";

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  locale: z.string().max(10).optional(),
});

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/profile", async (request, reply) => {
    const user = request.user as { sub: string };
    const [row] = await db
      .select({
        userId: tUser.userId,
        email: tUser.email,
        name: tUser.name,
        role: tUser.role,
        locale: tUser.locale,
      })
      .from(tUser)
      .where(eq(tUser.userId, user.sub))
      .limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "User not found" });
    return row;
  });

  fastify.put("/profile", async (request, reply) => {
    const user = request.user as { sub: string };
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tUser)
      .set(body)
      .where(eq(tUser.userId, user.sub))
      .returning({
        userId: tUser.userId,
        email: tUser.email,
        name: tUser.name,
        role: tUser.role,
        locale: tUser.locale,
      });
    if (!row) return reply.status(404).send({ error: "NotFound", message: "User not found" });
    return row;
  });
};

export default profileRoutes;
