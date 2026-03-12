import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tCustomer } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  location: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

const updateSchema = createSchema.partial();

const customersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = z
      .object({ page: z.coerce.number().default(1), per_page: z.coerce.number().default(20) })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tCustomer).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tCustomer),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(tCustomer).where(eq(tCustomer.customerId, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Customer not found" });
    return row;
  });

  fastify.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const [row] = await db.insert(tCustomer).values(body).returning();
    return reply.status(201).send(row);
  });

  fastify.put("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tCustomer)
      .set({ ...body, updatedTs: new Date() })
      .where(eq(tCustomer.customerId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Customer not found" });
    return row;
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db
      .delete(tCustomer)
      .where(eq(tCustomer.customerId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Customer not found" });
    return reply.status(204).send();
  });
};

export default customersRoutes;
