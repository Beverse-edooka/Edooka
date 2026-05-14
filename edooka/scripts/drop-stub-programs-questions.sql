-- =============================================================================
-- Run once in Supabase → SQL → New query (use a maintenance window if prod).
--
-- Your Table Editor showed programs/questions with bigint (int8) ids and a
-- minimal questions shape. Edooka expects UUID ids and full columns — see
-- src/lib/db/schema.ts. Stub tables block drizzle-kit push / inserts.
--
-- After running:
--   cd edooka
--   npm run db:push
--   npm run seed
-- =============================================================================

DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;
