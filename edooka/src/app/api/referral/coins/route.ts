import { NextRequest, NextResponse } from "next/server";
import { getCoinsByReferralCode, isValidReferralCode } from "@/lib/referral-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const referralCode = req.nextUrl.searchParams.get("referralCode")?.trim() ?? "";
  if (!isValidReferralCode(referralCode)) {
    return NextResponse.json({ error: "Invalid referral code format" }, { status: 400 });
  }
  const coins = await getCoinsByReferralCode(referralCode);
  return NextResponse.json({ ok: true, referralCode, coins });
}
