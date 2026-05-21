import { NextRequest, NextResponse } from "next/server";
import { awardReferralCoin, isValidReferralCode } from "@/lib/referral-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: {
    referralCode?: string;
    referredEmail?: string;
    trigger?: "payment" | "certificate_download";
    purchaseId?: string;
    certificateNumber?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referralCode = body.referralCode?.trim() ?? "";
  const referredEmail = body.referredEmail?.trim().toLowerCase() ?? "";
  const trigger = body.trigger;

  if (!isValidReferralCode(referralCode)) {
    return NextResponse.json({ error: "Invalid referral code format" }, { status: 400 });
  }
  if (!referredEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid referred email" }, { status: 400 });
  }
  if (trigger !== "payment" && trigger !== "certificate_download") {
    return NextResponse.json({ error: "Invalid trigger" }, { status: 400 });
  }

  const result = await awardReferralCoin({
    referralCode,
    referredEmail,
    trigger,
    purchaseId: body.purchaseId,
    certificateNumber: body.certificateNumber,
  });

  return NextResponse.json({
    ok: true,
    awarded: result.awarded,
    coins: result.coins,
  });
}
