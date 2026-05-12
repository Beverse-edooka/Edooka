import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * File: db client
 * Purpose: Creates a shared Drizzle client for server-side data access.
 */
function resolveConnectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // `next build` evaluates modules without a real DB; avoid failing at import time.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "postgresql://build:build@127.0.0.1:5432/build";
  }
  if (process.env.NODE_ENV === "development") {
    return "postgresql://postgres:postgres@127.0.0.1:5432/edooka";
  }
  throw new Error(
    "DATABASE_URL is required. Set it in the environment (see .env.example)."
  );
}

const client = postgres(resolveConnectionString(), { prepare: false });

export const db = drizzle(client, { schema });
