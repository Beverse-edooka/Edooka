import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { rewriteSupabaseDbUrlIfNeeded } from "./src/lib/db/rewrite-supabase-url";

// Match Next.js: prefer `.env.local` so `npm run db:push` works with Neon/local secrets there.
config({ path: path.resolve(process.cwd(), ".env.local") });
config();

const databaseUrl = rewriteSupabaseDbUrlIfNeeded(process.env.DATABASE_URL ?? "");

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
