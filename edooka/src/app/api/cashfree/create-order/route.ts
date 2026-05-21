import { NextRequest, NextResponse } from "next/server";
import { createCashfreeOrder } from "@/lib/cashfree";
export const runtime = "nodejs";

/**
 * POST /api/cashfree/create-order
 * Creates a Cashfree order and returns the hosted checkout URL (or demo URL without keys).
 */
export async function POST(req: NextRequest) {
  let body: {
    bundleKey?: string;
    attemptId?: string;
    customer?: { name?: string; email?: string; phone?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await createCashfreeOrder({
    bundleKey: body.bundleKey ?? "",
    attemptId: body.attemptId ?? "",
    customer: body.customer,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        hint: result.hint,
        details: result.details,
      },
      { status: result.status }
    );
  }

  return NextResponse.json({
    orderId: result.orderId,
    paymentLink: result.paymentLink,
    demo: result.demo ?? false,
    message: result.message,
  });
}
