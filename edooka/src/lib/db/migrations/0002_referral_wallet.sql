-- Server-side referral wallet + events (tamper-resistant replacement for localStorage coins).
-- Idempotent migration.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_trigger') THEN
    CREATE TYPE "referral_trigger" AS ENUM ('payment', 'certificate_download');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "referral_wallets" (
  "referral_code" text PRIMARY KEY,
  "coins" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "referral_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "referral_code" text NOT NULL REFERENCES "referral_wallets"("referral_code") ON DELETE cascade,
  "referred_email" text NOT NULL,
  "trigger" "referral_trigger" NOT NULL,
  "purchase_id" text,
  "certificate_number" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_referral_events_refcode_email"
  ON "referral_events" ("referral_code", "referred_email");

CREATE INDEX IF NOT EXISTS "idx_referral_events_refcode"
  ON "referral_events" ("referral_code");
