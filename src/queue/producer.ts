import { Queue } from "bullmq";
import { env } from "../config/env.js";

// BullMQ manages its own connection with maxRetriesPerRequest: null
const bullConnection = {
  url: env.REDIS_URL,
  keyPrefix: env.REDIS_KEY_PREFIX,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

export const eventQueue = new Queue("events", { connection: bullConnection });

export async function publishEvent(
  eventName: string,
  payload: Record<string, unknown>
): Promise<void> {
  await eventQueue.add(eventName, {
    event: eventName,
    payload,
    timestamp: new Date().toISOString(),
  });
}
