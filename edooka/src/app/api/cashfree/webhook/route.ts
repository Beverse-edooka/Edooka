import { NextRequest, NextResponse } from "next/server";

/**
 * Route: POST /api/cashfree/webhook
 * Purpose: Placeholder for verified, idempotent Cashfree webhook handling.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  return NextResponse.json({ received: true, length: body.length });
}
