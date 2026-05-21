import { NextRequest, NextResponse } from "next/server";
import { ensureWallet, getCoinsByReferralCode, isValidReferralCode } from "@/lib/referral-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { referralCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referralCode = body.referralCode?.trim() ?? "";
  if (!isValidReferralCode(referralCode)) {
    return NextResponse.json({ error: "Invalid referral code format" }, { status: 400 });
  }

  await ensureWallet(referralCode);
  const coins = await getCoinsByReferralCode(referralCode);
  return NextResponse.json({ ok: true, referralCode, coins });
}
