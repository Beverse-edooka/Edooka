-- Hand-rolled migration for the certificate verification flow.
-- Run AFTER an initial `npm run db:push` (or apply directly to your Postgres).
-- Safe to re-run: every statement uses IF (NOT) EXISTS / WHERE-guards.

-- 1. Add the columns the issue API now writes to.
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS qr_token text;

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS revoked boolean NOT NULL DEFAULT false;

-- Add the unique constraint on qr_token in a separate statement so the
-- column add stays idempotent even if the constraint was already created.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'certificates_qr_token_unique'
  ) THEN
    ALTER TABLE certificates
      ADD CONSTRAINT certificates_qr_token_unique UNIQUE (qr_token);
  END IF;
END $$;

-- 2. Backfill: earlier schema versions defaulted num_questions to 18.
-- The catalog UI shows "{n} questions · 15 min", so realign any stale
-- rows to the current default of 15.
UPDATE programs SET num_questions = 15 WHERE num_questions = 18;
