/**
 * Shared bundle definitions for post-assessment checkout and success flows.
 * Amounts are in INR (rupees) for display; use paise helpers for payments APIs.
 */
export type BundleKey = "single" | "bundle3" | "bundle5";

export type PricingTier = {
  key: BundleKey;
  tier: string;
  priceInr: number;
  priceDisplay: string;
  /** How many certificate PDFs the purchaser may download (now or later). */
  certificateCount: number;
  sub?: string;
  note: string;
  cta: string;
  popular: boolean;
  perCert?: string;
  save?: string;
};

export const PRICING_TIERS: PricingTier[] = [
  {
    key: "single",
    tier: "SINGLE",
    priceInr: 218,
    priceDisplay: "₹218",
    certificateCount: 1,
    sub: "1 certificate",
    note: "Download 1 certificate",
    cta: "Choose single",
    popular: false,
  },
  {
    key: "bundle3",
    tier: "BUNDLE OF 3",
    priceInr: 590,
    priceDisplay: "₹590",
    certificateCount: 3,
    sub: "₹197 per certificate",
    note: "Download up to 3 certificates (now or later)",
    cta: "Choose bundle",
    popular: true,
    perCert: "₹197",
    save: "SAVE ₹64",
  },
  {
    key: "bundle5",
    tier: "BUNDLE OF 5",
    priceInr: 944,
    priceDisplay: "₹944",
    certificateCount: 5,
    sub: "₹189 per certificate",
    note: "Download up to 5 certificates (now or later)",
    cta: "Choose bundle",
    popular: false,
    perCert: "₹189",
    save: "SAVE ₹146",
  },
];

export function getTierByKey(key: string): PricingTier | undefined {
  return PRICING_TIERS.find((t) => t.key === key);
}

export function getCertificateCountForBundle(key: string): number {
  return getTierByKey(key)?.certificateCount ?? 1;
}

export function inrToPaise(inr: number): number {
  return Math.round(inr * 100);
}
