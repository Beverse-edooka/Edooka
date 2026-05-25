import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchases } from "@/lib/db/schema";
import type { PaymentStatus } from "@/types";

export const runtime = "nodejs";

function mapCashfreeStatus(raw: string): PaymentStatus {
  const status = raw.toUpperCase();
  if (status === "PAID") return "success";
  if (status === "EXPIRED" || status === "CANCELLED" || status === "TERMINATED" || status === "FAILED") {
    return "failed";
  }
  return "pending";
}

/**
 * POST /api/cashfree/webhook
 * Updates local purchase payment status from Cashfree order events.
 */
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = (payload.data ?? payload) as Record<string, unknown>;
  const order = (data.order ?? data) as Record<string, unknown>;
  const orderId = String(order.order_id ?? order.orderId ?? "").trim();
  const orderStatus = String(order.order_status ?? order.orderStatus ?? "").trim();
  const paymentId = String(order.payment_id ?? order.paymentId ?? "").trim();

  if (!orderId || !orderStatus) {
    return NextResponse.json({ received: true, skipped: true });
  }

  const paymentStatus = mapCashfreeStatus(orderStatus);

  try {
    const [existing] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.cashfreeOrderId, orderId))
      .limit(1);

    if (existing) {
      await db
        .update(purchases)
        .set({
          paymentStatus,
          ...(paymentId ? { cashfreePaymentId: paymentId } : {}),
        })
        .where(eq(purchases.cashfreeOrderId, orderId));
    }
  } catch (e) {
    console.error("[cashfree/webhook]", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, orderId, paymentStatus });
}
