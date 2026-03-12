import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyError } from "fastify";
import { ZodError } from "zod";

function isFastifyError(err: unknown): err is FastifyError {
  return err instanceof Error && "statusCode" in err;
}

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "ValidationError",
        message: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      });
    }

    const statusCode = isFastifyError(error) ? (error.statusCode ?? 500) : 500;
    const name = error instanceof Error ? (error.name ?? "InternalServerError") : "InternalServerError";
    const message = error instanceof Error ? (error.message ?? "An unexpected error occurred") : "An unexpected error occurred";
    fastify.log.error(error);
    return reply.status(statusCode).send({ error: name, message });
  });
};

export default fp(errorHandlerPlugin);
