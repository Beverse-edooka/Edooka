-- Ledger for referral wallet coin redemption (server-side spend).
-- Idempotent migration.

CREATE TABLE IF NOT EXISTS "referral_spends" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "referral_code" text NOT NULL REFERENCES "referral_wallets"("referral_code") ON DELETE cascade,
  "attempt_id" text NOT NULL UNIQUE,
  "coins_spent" integer NOT NULL DEFAULT 5,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
