import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default("3000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_REGION: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_LOCALSTACK: z.coerce.boolean().default(false),
});

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error("❌ Invalid environment variables:");
  console.error(envResult.error.format());
  process.exit(1);
}

export const env = envResult.data;

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export type Environment = typeof env;
