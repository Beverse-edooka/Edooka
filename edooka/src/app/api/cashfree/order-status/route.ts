import { NextRequest, NextResponse } from "next/server";
import { resolvePaymentPaidForOrder } from "@/lib/cashfree-order";

export const runtime = "nodejs";

/**
 * GET /api/cashfree/order-status?orderId=...&demo=0|1
 * Verifies Cashfree payment before certificate fulfillment.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")?.trim() ?? "";
  const demoQuery = req.nextUrl.searchParams.get("demo") === "1";

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const result = await resolvePaymentPaidForOrder(orderId, demoQuery);
  return NextResponse.json(result);
}
