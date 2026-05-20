-- Adds qr_token + revoked columns to certificates so the verify API can
-- look up by either the opaque qrToken embedded in the QR code, or the
-- human-readable certificateNumber. Also realigns any pre-existing
-- `programs.num_questions = 18` rows to 15 so the assessment/library
-- cards display "15 questions · 15 min" consistently.
-- Run with `npm run db:push` or apply this file directly with psql.

ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "qr_token" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'certificates_qr_token_unique'
  ) THEN
    ALTER TABLE "certificates"
      ADD CONSTRAINT "certificates_qr_token_unique" UNIQUE ("qr_token");
  END IF;
END $$;

ALTER TABLE "certificates"
  ADD COLUMN IF NOT EXISTS "revoked" boolean NOT NULL DEFAULT false;

UPDATE "programs" SET "num_questions" = 15 WHERE "num_questions" = 18;
