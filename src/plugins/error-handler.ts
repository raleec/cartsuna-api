import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "ValidationError",
        message: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      });
    }

    const statusCode = error.statusCode ?? 500;
    fastify.log.error(error);
    return reply.status(statusCode).send({
      error: error.name ?? "InternalServerError",
      message: error.message ?? "An unexpected error occurred",
    });
  });
};

export default fp(errorHandlerPlugin);
