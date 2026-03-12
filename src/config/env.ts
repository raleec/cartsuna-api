import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string().url().optional().default("postgresql://cartsuna:cartsuna@localhost:5432/cartsuna_dev"),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_KEY_PREFIX: z.string().default("cartsuna:"),
  JWT_SECRET: z.string().min(1).default("dev-jwt-secret-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_SECRET: z.string().min(1).default("dev-refresh-secret-change-in-production"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  FEATURE_RECOMMENDATIONS_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  FEATURE_BLUETOOTH_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  FEATURE_ADMIN_PORTAL_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  BULLMQ_CONCURRENCY: z.coerce.number().default(5),
  BULLMQ_STALE_SESSION_CRON: z.string().default("*/5 * * * *"),
});

export const env = envSchema.parse(process.env);
