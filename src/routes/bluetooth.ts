import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tBluetoothSession } from "../db/schema/index.js";
import { featureFlags } from "../config/feature-flags.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  merchantId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  state: z.string().default("active"),
});

const bluetoothRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/bluetooth/sessions", async (request, reply) => {
    if (!featureFlags.bluetooth) {
      return reply.status(404).send({ error: "NotFound", message: "Feature not enabled" });
    }
    const query = z
      .object({ page: z.coerce.number().default(1), per_page: z.coerce.number().default(20) })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(tBluetoothSession).limit(query.per_page).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(tBluetoothSession),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.post("/bluetooth/sessions", async (request, reply) => {
    if (!featureFlags.bluetooth) {
      return reply.status(404).send({ error: "NotFound", message: "Feature not enabled" });
    }
    const body = createSchema.parse(request.body);
    const [row] = await db.insert(tBluetoothSession).values(body).returning();
    return reply.status(201).send(row);
  });

  fastify.patch("/bluetooth/sessions/:id", async (request, reply) => {
    if (!featureFlags.bluetooth) {
      return reply.status(404).send({ error: "NotFound", message: "Feature not enabled" });
    }
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z.object({ state: z.string() }).parse(request.body);
    const [row] = await db
      .update(tBluetoothSession)
      .set({ state: body.state, updatedTs: new Date() })
      .where(eq(tBluetoothSession.sessionId, id))
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Session not found" });
    return row;
  });
};

export default bluetoothRoutes;
