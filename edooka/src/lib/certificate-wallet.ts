import { certificateNumberForAttempt } from "@/lib/certificate";

const WALLET_KEY = "edooka_certificate_wallet";
const PURCHASE_CREDIT_FLAG = "edooka_purchase_credited_";

export type IssuedCertificate = {
  certificateNumber: string;
  attemptId: string;
  programTitle: string;
  slug: string;
  issuedAt: number;
  purchaseId?: string;
};

export type CertificateWallet = {
  remainingCredits: number;
  issued: IssuedCertificate[];
};

function emptyWallet(): CertificateWallet {
  return { remainingCredits: 0, issued: [] };
}

export function readWallet(): CertificateWallet {
  if (typeof window === "undefined") return emptyWallet();
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return emptyWallet();
    const data = JSON.parse(raw) as CertificateWallet;
    return {
      remainingCredits: Math.max(0, Number(data.remainingCredits) || 0),
      issued: Array.isArray(data.issued) ? data.issued : [],
    };
  } catch {
    return emptyWallet();
  }
}

function writeWallet(wallet: CertificateWallet): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

export function getRemainingCredits(): number {
  return readWallet().remainingCredits;
}

export function getIssuedForAttempt(attemptId: string): IssuedCertificate | undefined {
  return readWallet().issued.find((c) => c.attemptId === attemptId);
}

export function isAttemptRedeemed(attemptId: string): boolean {
  return Boolean(getIssuedForAttempt(attemptId));
}

/** Add credits once per purchase (bundle 1 → 1, bundle3 → 3, bundle5 → 5). */
export function addCreditsFromPurchase(purchaseId: string, credits: number): number {
  if (typeof window === "undefined" || credits < 1) return readWallet().remainingCredits;
  const flagKey = `${PURCHASE_CREDIT_FLAG}${purchaseId}`;
  if (sessionStorage.getItem(flagKey)) return readWallet().remainingCredits;

  const wallet = readWallet();
  wallet.remainingCredits += credits;
  writeWallet(wallet);
  sessionStorage.setItem(flagKey, "1");
  return wallet.remainingCredits;
}

export type RedeemInput = {
  attemptId: string;
  slug: string;
  programTitle: string;
  purchaseId?: string;
};

export type RedeemResult =
  | { ok: true; certificate: IssuedCertificate; usedCredit: boolean }
  | { ok: false; reason: "no_credits" | "missing_attempt" };

/**
 * Issue a certificate for this attempt. Reuses existing issuance without consuming another credit.
 * Otherwise consumes one wallet credit and records certificate number.
 */
export function redeemCertificateCredit(input: RedeemInput): RedeemResult {
  if (typeof window === "undefined") return { ok: false, reason: "missing_attempt" };

  const wallet = readWallet();
  const existing = wallet.issued.find((c) => c.attemptId === input.attemptId);
  if (existing) {
    return { ok: true, certificate: existing, usedCredit: false };
  }

  if (wallet.remainingCredits < 1) {
    return { ok: false, reason: "no_credits" };
  }

  const certificate: IssuedCertificate = {
    certificateNumber: certificateNumberForAttempt(input.attemptId),
    attemptId: input.attemptId,
    programTitle: input.programTitle,
    slug: input.slug,
    issuedAt: Date.now(),
    purchaseId: input.purchaseId,
  };

  wallet.remainingCredits -= 1;
  wallet.issued.push(certificate);
  writeWallet(wallet);

  return { ok: true, certificate, usedCredit: true };
}

export function listIssuedCertificates(): IssuedCertificate[] {
  return readWallet().issued;
}
