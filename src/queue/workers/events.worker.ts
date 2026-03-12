import { Worker } from "bullmq";
import { env } from "../../config/env.js";

export function startEventsWorker() {
  const connection = {
    url: env.REDIS_URL,
    keyPrefix: env.REDIS_KEY_PREFIX,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  };

  const worker = new Worker(
    "events",
    async (job) => {
      console.log(`[EventWorker] Processing job ${job.id}: ${job.name}`, job.data);
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`[EventWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
}
