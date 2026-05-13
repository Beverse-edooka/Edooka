import { NextRequest, NextResponse } from "next/server";
import { getTierByKey } from "@/lib/pricing";

/**
 * POST /api/cashfree/create-order
 * Creates a Cashfree order and returns the hosted checkout URL (or a demo URL without keys).
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

  const bundleKey = body.bundleKey ?? "";
  const attemptId = body.attemptId ?? "";
  const tier = getTierByKey(bundleKey);
  if (!tier || !attemptId) {
    return NextResponse.json({ error: "Invalid bundle or attempt" }, { status: 400 });
  }

  const customer = body.customer ?? {};
  const email = customer.email?.trim() ?? "learner@example.com";
  const phoneDigits = (customer.phone ?? "").replace(/\D/g, "").slice(-10) || "9999999999";
  const name = customer.name?.trim() ?? "Learner";

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const orderId = `edooka_${attemptId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;
  const returnUrl = `${baseUrl}/success/${encodeURIComponent(orderId)}?attemptId=${encodeURIComponent(attemptId)}&bundle=${encodeURIComponent(bundleKey)}`;

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    const demoUrl = `${returnUrl}&demo=1`;
    return NextResponse.json({
      demo: true,
      orderId,
      paymentLink: demoUrl,
      message: "Cashfree keys missing — using demo success URL.",
    });
  }

  const isProd = process.env.NEXT_PUBLIC_CASHFREE_MODE === "PRODUCTION";
  const apiHost = isProd ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";

  const res = await fetch(`${apiHost}/pg/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": appId,
      "x-client-secret": secretKey,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: tier.priceInr,
      order_currency: "INR",
      customer_details: {
        customer_id: email.replace(/[^a-zA-Z0-9@._-]/g, "").slice(0, 50) || "customer",
        customer_email: email,
        customer_phone: phoneDigits,
        customer_name: name,
      },
      order_meta: {
        return_url: returnUrl,
      },
    }),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    return NextResponse.json(
      { error: (data.message as string) || "Cashfree order failed", details: data },
      { status: 502 }
    );
  }

  const paymentSessionId = data.payment_session_id as string | undefined;
  if (!paymentSessionId) {
    return NextResponse.json({ error: "No payment_session_id", details: data }, { status: 502 });
  }

  const checkoutHost = isProd ? "https://payments.cashfree.com" : "https://sandbox.cashfree.com";
  const paymentLink = `${checkoutHost}/pg/checkout?payment_session_id=${encodeURIComponent(paymentSessionId)}`;

  return NextResponse.json({ orderId, paymentLink });
}
