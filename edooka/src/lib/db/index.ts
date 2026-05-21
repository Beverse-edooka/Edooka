import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { rewriteSupabaseDbUrlIfNeeded } from "./rewrite-supabase-url";

/**
 * File: db client
 * Purpose: Creates a shared Drizzle client for server-side data access.
 *
 * Neon: use the *pooled* connection string from the dashboard (host contains `-pooler`)
 * to avoid 2–3s cold connects on serverless routes.
 */
/** Strip query params that break Vercel/serverless Postgres clients (e.g. Neon copy-paste). */
function normalizeDatabaseUrl(url: string): string {
  let out = rewriteSupabaseDbUrlIfNeeded(url.trim());
  out = out.replace(/([?&])channel_binding=require(&?)/gi, "$1");
  out = out.replace(/\?&/, "?").replace(/\?$/, "");
  return out;
}

function resolveConnectionString(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv) return normalizeDatabaseUrl(fromEnv);
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

const client = postgres(resolveConnectionString(), {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
});

export const db = drizzle(client, { schema });
