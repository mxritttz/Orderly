import { config } from "dotenv";
import { z } from "zod";

config();

const booleanFromEnv = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),
  SESSION_COOKIE_SECURE: booleanFromEnv.default("false"),
  DATABASE_URL: z.string().min(1),
});

export const env = envSchema.parse(process.env);
