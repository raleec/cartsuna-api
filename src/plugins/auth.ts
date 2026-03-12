import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env.js";
import { redis } from "../redis/client.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(import("@fastify/jwt"), {
    secret: env.JWT_SECRET,
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify();
        const token = request.headers.authorization?.split(" ")[1];
        if (token) {
          const blacklisted = await redis.get(`blacklist:${token}`);
          if (blacklisted) {
            return reply
              .status(401)
              .send({ error: "Unauthorized", message: "Token has been revoked" });
          }
        }
      } catch (err) {
        reply.send(err);
      }
    }
  );
};

export default fp(authPlugin);
