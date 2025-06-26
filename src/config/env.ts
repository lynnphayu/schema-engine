import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default("3000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_JWT_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_REGION: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_LOCALSTACK: z.coerce.boolean().default(false),
});

// Parse and validate environment variables
const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error("❌ Invalid environment variables:");
  console.error(envResult.error.format());
  process.exit(1);
}

export const env = envResult.data;

// Helper function to check if we're in development
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Export types for TypeScript
export type Environment = typeof env;
