import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tRequest } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  customerId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  merchantId: z.string().uuid(),
  title: z.string().min(1).max(255),
  desc: z.string().optional(),
  eta: z.string().datetime().optional(),
  status: z.string().default("open"),
});

const updateSchema = createSchema.partial();

const requestsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = z
      .object({ page: z.coerce.number().default(1), per_page: z.coerce.number().default(20) })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tRequest).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tRequest),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(tRequest).where(eq(tRequest.requestId, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Request not found" });
    return row;
  });

  fastify.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const [row] = await db
      .insert(tRequest)
      .values({ ...body, eta: body.eta ? new Date(body.eta) : undefined })
      .returning();
    return reply.status(201).send(row);
  });

  fastify.put("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tRequest)
      .set({ ...body, eta: body.eta ? new Date(body.eta) : undefined })
      .where(eq(tRequest.requestId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Request not found" });
    return row;
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.delete(tRequest).where(eq(tRequest.requestId, id)).returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Request not found" });
    return reply.status(204).send();
  });
};

export default requestsRoutes;
