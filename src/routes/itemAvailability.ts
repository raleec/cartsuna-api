import type { FastifyPluginAsync } from "fastify";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection.js";
import { tItemAvailability } from "../db/schema/index.js";
import { buildPagination, pageToOffset } from "@cartsuna/utils";

const createSchema = z.object({
  merchantId: z.string().uuid(),
  locationName: z.string().optional(),
  locationAddr: z.string().optional(),
  startTs: z.string().datetime(),
  endTs: z.string().datetime(),
  timezone: z.string().default("UTC"),
  rrule: z.string().optional(),
  recurrenceEnd: z.string().datetime().optional(),
  quota: z.number().int().optional(),
  unitPrice: z.number().optional(),
  tax: z.number().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().default("active"),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

const updateSchema = createSchema.partial();

const itemAvailabilityRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/:itemId/availability", async (request) => {
    const { itemId } = z.object({ itemId: z.string().uuid() }).parse(request.params);
    const query = z
      .object({ page: z.coerce.number().default(1), per_page: z.coerce.number().default(20) })
      .parse(request.query);
    const offset = pageToOffset(query.page, query.per_page);

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(tItemAvailability)
        .where(eq(tItemAvailability.itemId, itemId))
        .limit(query.per_page)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(tItemAvailability)
        .where(eq(tItemAvailability.itemId, itemId)),
    ]);
    return { data: rows, pagination: buildPagination(query.page, query.per_page, count) };
  });

  fastify.get("/:itemId/availability/:availabilityId", async (request, reply) => {
    const { itemId, availabilityId } = z
      .object({ itemId: z.string().uuid(), availabilityId: z.string().uuid() })
      .parse(request.params);
    const [row] = await db
      .select()
      .from(tItemAvailability)
      .where(
        and(
          eq(tItemAvailability.itemId, itemId),
          eq(tItemAvailability.availabilityId, availabilityId)
        )
      )
      .limit(1);
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Availability not found" });
    return row;
  });

  fastify.post("/:itemId/availability", async (request, reply) => {
    const { itemId } = z.object({ itemId: z.string().uuid() }).parse(request.params);
    const body = createSchema.parse(request.body);
    const [row] = await db
      .insert(tItemAvailability)
      .values({
        ...body,
        itemId,
        startTs: new Date(body.startTs),
        endTs: new Date(body.endTs),
        recurrenceEnd: body.recurrenceEnd ? new Date(body.recurrenceEnd) : undefined,
      })
      .returning();
    return reply.status(201).send(row);
  });

  fastify.put("/:itemId/availability/:availabilityId", async (request, reply) => {
    const { itemId, availabilityId } = z
      .object({ itemId: z.string().uuid(), availabilityId: z.string().uuid() })
      .parse(request.params);
    const body = updateSchema.parse(request.body);
    const [row] = await db
      .update(tItemAvailability)
      .set({
        ...body,
        startTs: body.startTs ? new Date(body.startTs) : undefined,
        endTs: body.endTs ? new Date(body.endTs) : undefined,
        recurrenceEnd: body.recurrenceEnd ? new Date(body.recurrenceEnd) : undefined,
        updatedTs: new Date(),
      })
      .where(
        and(
          eq(tItemAvailability.itemId, itemId),
          eq(tItemAvailability.availabilityId, availabilityId)
        )
      )
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Availability not found" });
    return row;
  });

  fastify.delete("/:itemId/availability/:availabilityId", async (request, reply) => {
    const { itemId, availabilityId } = z
      .object({ itemId: z.string().uuid(), availabilityId: z.string().uuid() })
      .parse(request.params);
    const [row] = await db
      .delete(tItemAvailability)
      .where(
        and(
          eq(tItemAvailability.itemId, itemId),
          eq(tItemAvailability.availabilityId, availabilityId)
        )
      )
      .returning();
    if (!row) return reply.status(404).send({ error: "NotFound", message: "Availability not found" });
    return reply.status(204).send();
  });
};

export default itemAvailabilityRoutes;
