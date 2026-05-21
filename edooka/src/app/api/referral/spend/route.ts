import { NextRequest, NextResponse } from "next/server";
import { isValidReferralCode, spendReferralCoins } from "@/lib/referral-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { referralCode?: string; attemptId?: string; coins?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referralCode = body.referralCode?.trim() ?? "";
  const attemptId = body.attemptId?.trim() ?? "";
  const coins = body.coins ?? 5;

  if (!isValidReferralCode(referralCode)) {
    return NextResponse.json({ error: "Invalid referral code format" }, { status: 400 });
  }
  if (!attemptId) {
    return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
  }

  const result = await spendReferralCoins({ referralCode, attemptId, coins });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
