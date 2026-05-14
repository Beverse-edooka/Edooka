/**
 * Loads `.env.local` then `.env` so CLI scripts (seed, etc.) see DATABASE_URL like Next.js.
 */
import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env.local") });
config();
