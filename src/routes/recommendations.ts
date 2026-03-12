import type { FastifyPluginAsync } from "fastify";
import { featureFlags } from "../config/feature-flags.js";

const recommendationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/recommendations", async (_request, reply) => {
    if (!featureFlags.recommendations) {
      return reply.status(404).send({ error: "NotFound", message: "Feature not enabled" });
    }
    // Placeholder: return empty recommendations
    return { data: [], message: "Recommendations feature coming soon" };
  });
};

export default recommendationsRoutes;
