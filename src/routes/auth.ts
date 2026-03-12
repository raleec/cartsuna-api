import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { db } from "../db/connection.js";
import { tUser } from "../db/schema/index.js";
import { redis } from "../redis/client.js";
import { env } from "../config/env.js";

const BCRYPT_ROUNDS = 12;

// Rate limit config for auth endpoints to prevent brute force
const authRateLimit = {
  max: 10,
  timeWindow: "1 minute",
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(50),
  role: z.enum(["customer", "merchant", "admin"]).default("customer"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/register", { config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const passphrase = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    const [user] = await db
      .insert(tUser)
      .values({
        email: body.email,
        passphrase,
        role: body.role,
        name: body.name,
      })
      .returning();
    const accessToken = fastify.jwt.sign(
      { sub: user.userId, email: user.email, role: user.role },
      { expiresIn: env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { sub: user.userId, type: "refresh" },
      env.REFRESH_TOKEN_SECRET,
      { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );
    return reply.status(201).send({
      accessToken,
      refreshToken,
      user: { userId: user.userId, email: user.email, name: user.name, role: user.role },
    });
  });

  fastify.post("/login", { config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const [user] = await db.select().from(tUser).where(eq(tUser.email, body.email)).limit(1);
    if (!user)
      return reply.status(401).send({ error: "Unauthorized", message: "Invalid credentials" });
    const valid = await bcrypt.compare(body.password, user.passphrase);
    if (!valid)
      return reply.status(401).send({ error: "Unauthorized", message: "Invalid credentials" });
    const accessToken = fastify.jwt.sign(
      { sub: user.userId, email: user.email, role: user.role },
      { expiresIn: env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { sub: user.userId, type: "refresh" },
      env.REFRESH_TOKEN_SECRET,
      { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );
    return {
      accessToken,
      refreshToken,
      user: { userId: user.userId, email: user.email, name: user.name, role: user.role },
    };
  });

  fastify.post("/refresh", { config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const body = z.object({ refreshToken: z.string() }).parse(request.body);
    try {
      const payload = jwt.verify(body.refreshToken, env.REFRESH_TOKEN_SECRET) as {
        sub: string;
        type: string;
      };
      if (payload.type !== "refresh")
        return reply
          .status(401)
          .send({ error: "Unauthorized", message: "Invalid token type" });
      const [user] = await db
        .select()
        .from(tUser)
        .where(eq(tUser.userId, payload.sub))
        .limit(1);
      if (!user)
        return reply.status(401).send({ error: "Unauthorized", message: "User not found" });
      const accessToken = fastify.jwt.sign(
        { sub: user.userId, email: user.email, role: user.role },
        { expiresIn: env.JWT_EXPIRES_IN }
      );
      return { accessToken };
    } catch {
      return reply
        .status(401)
        .send({ error: "Unauthorized", message: "Invalid refresh token" });
    }
  });

  fastify.post("/logout", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const token = request.headers.authorization?.split(" ")[1];
    if (token) {
      // Blacklist token for 24h (longer than max JWT lifetime)
      await redis.setex(`blacklist:${token}`, 86400, "1");
    }
    return reply.status(204).send();
  });
};

export default authRoutes;
