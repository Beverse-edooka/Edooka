import { NextResponse } from "next/server";

function cleanEnv(value?: string): string {
  if (!value) return "";
  let out = value.trim();
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1).trim();
  }
  out = out.replace(/,+$/, "").trim();
  return out;
}

function mask(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

/**
 * GET /api/cashfree/debug
 * Safe diagnostics: reports parsed mode/flags and masked key metadata.
 */
export async function GET() {
  const rawMode = process.env.NEXT_PUBLIC_CASHFREE_MODE ?? "";
  const rawLive = process.env.CASHFREE_LIVE_PAYMENTS ?? "";
  const rawAppId = process.env.CASHFREE_APP_ID ?? "";
  const rawSecret = process.env.CASHFREE_SECRET_KEY ?? "";

  const mode = cleanEnv(rawMode).toUpperCase();
  const liveFlag = cleanEnv(rawLive);
  const appId = cleanEnv(rawAppId);
  const secret = cleanEnv(rawSecret);

  return NextResponse.json({
    ok: true,
    parsed: {
      mode,
      livePayments: liveFlag,
      appIdPrefix: appId.slice(0, 12),
      appIdMasked: mask(appId),
      secretMasked: mask(secret),
      appIdLooksTest: appId.toUpperCase().includes("TEST"),
      secretLooksTest: secret.toLowerCase().includes("_test_"),
      hasAppId: Boolean(appId),
      hasSecret: Boolean(secret),
    },
    rawLengths: {
      mode: rawMode.length,
      livePayments: rawLive.length,
      appId: rawAppId.length,
      secret: rawSecret.length,
    },
    guidance: [
      "Use exact values: NEXT_PUBLIC_CASHFREE_MODE=TEST and CASHFREE_LIVE_PAYMENTS=1",
      "Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY as separate variables (no commas).",
      "Remove quotes and trailing commas from env values.",
    ],
  });
}

