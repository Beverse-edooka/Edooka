import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { referralEvents, referralSpends, referralWallets } from "@/lib/db/schema";

export type ReferralAwardTrigger = "payment" | "certificate_download";

const CODE_RE = /^[a-zA-Z0-9_-]{6,64}$/;

function normalizeCode(input: string): string {
  return input.trim();
}

export function isValidReferralCode(input: string): boolean {
  return CODE_RE.test(input.trim());
}

export async function ensureWallet(referralCodeRaw: string): Promise<string> {
  const referralCode = normalizeCode(referralCodeRaw);
  await db
    .insert(referralWallets)
    .values({ referralCode, coins: 0 })
    .onConflictDoNothing();
  return referralCode;
}

export async function getCoinsByReferralCode(referralCodeRaw: string): Promise<number> {
  const referralCode = normalizeCode(referralCodeRaw);
  const rows = await db
    .select({ coins: referralWallets.coins })
    .from(referralWallets)
    .where(eq(referralWallets.referralCode, referralCode))
    .limit(1);
  return rows[0]?.coins ?? 0;
}

/**
 * Award +1 coin once per (referralCode, referredEmail), regardless of retries.
 */
export async function awardReferralCoin(input: {
  referralCode: string;
  referredEmail: string;
  trigger: ReferralAwardTrigger;
  purchaseId?: string;
  certificateNumber?: string;
}): Promise<{ awarded: boolean; coins: number }> {
  const referralCode = normalizeCode(input.referralCode);
  const referredEmail = input.referredEmail.trim().toLowerCase();
  if (!isValidReferralCode(referralCode) || !referredEmail) {
    return { awarded: false, coins: 0 };
  }

  await ensureWallet(referralCode);

  // Idempotency: only one event per (referralCode + referredEmail).
  const existing = await db
    .select({ id: referralEvents.id })
    .from(referralEvents)
    .where(
      and(
        eq(referralEvents.referralCode, referralCode),
        eq(referralEvents.referredEmail, referredEmail)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const coins = await getCoinsByReferralCode(referralCode);
    return { awarded: false, coins };
  }

  await db.transaction(async (tx) => {
    await tx.insert(referralEvents).values({
      referralCode,
      referredEmail,
      trigger: input.trigger,
      purchaseId: input.purchaseId,
      certificateNumber: input.certificateNumber,
    });
    await tx
      .update(referralWallets)
      .set({ coins: sql`${referralWallets.coins} + 1` })
      .where(eq(referralWallets.referralCode, referralCode));
  });

  const coins = await getCoinsByReferralCode(referralCode);
  return { awarded: true, coins };
}

/**
 * Spend referral coins once per attempt. Idempotent by attemptId.
 */
export async function spendReferralCoins(input: {
  referralCode: string;
  attemptId: string;
  coins?: number;
}): Promise<{ ok: boolean; spent: boolean; coins: number; reason?: string }> {
  const referralCode = normalizeCode(input.referralCode);
  const attemptId = input.attemptId.trim();
  const coinsToSpend = Math.max(1, Math.floor(input.coins ?? 5));
  if (!isValidReferralCode(referralCode) || !attemptId) {
    return { ok: false, spent: false, coins: 0, reason: "invalid_input" };
  }

  await ensureWallet(referralCode);

  const existingSpend = await db
    .select({ id: referralSpends.id })
    .from(referralSpends)
    .where(eq(referralSpends.attemptId, attemptId))
    .limit(1);

  if (existingSpend.length > 0) {
    const coins = await getCoinsByReferralCode(referralCode);
    return { ok: true, spent: false, coins, reason: "already_spent_for_attempt" };
  }

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ coins: referralWallets.coins })
      .from(referralWallets)
      .where(eq(referralWallets.referralCode, referralCode))
      .limit(1);
    const currentCoins = rows[0]?.coins ?? 0;
    if (currentCoins < coinsToSpend) {
      return { ok: false, spent: false, coins: currentCoins, reason: "insufficient_coins" };
    }

    await tx.insert(referralSpends).values({
      referralCode,
      attemptId,
      coinsSpent: coinsToSpend,
    });
    await tx
      .update(referralWallets)
      .set({ coins: sql`${referralWallets.coins} - ${coinsToSpend}` })
      .where(eq(referralWallets.referralCode, referralCode));

    const after = await tx
      .select({ coins: referralWallets.coins })
      .from(referralWallets)
      .where(eq(referralWallets.referralCode, referralCode))
      .limit(1);
    return { ok: true, spent: true, coins: after[0]?.coins ?? 0 };
  });
}
