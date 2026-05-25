import { NextRequest, NextResponse } from "next/server";
import { createCashfreeOrder } from "@/lib/cashfree";
import { upsertAttemptProfile } from "@/server/actions/attempt-profile";
export const runtime = "nodejs";

/**
 * POST /api/cashfree/create-order
 * Creates a Cashfree order and returns the hosted checkout URL (or demo URL without keys).
 */
export async function POST(req: NextRequest) {
  let body: {
    bundleKey?: string;
    attemptId?: string;
    programSlug?: string;
    customer?: { name?: string; email?: string; phone?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const forwardedProto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const forwardedHost =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.trim() ||
    "";
  const requestBaseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : undefined;

  // Persist learner profile + stub attempt server-side BEFORE Cashfree redirect.
  // Survives mobile browser handoffs where localStorage/sessionStorage may be lost
  // (e.g. iOS Safari, in-app browsers). Read back by attemptId after payment.
  if (body.attemptId && body.programSlug) {
    await upsertAttemptProfile({
      attemptId: body.attemptId,
      slug: body.programSlug,
      name: body.customer?.name,
      email: body.customer?.email,
      phone: body.customer?.phone,
    });
  }

  const result = await createCashfreeOrder({
    bundleKey: body.bundleKey ?? "",
    attemptId: body.attemptId ?? "",
    programSlug: body.programSlug,
    customer: body.customer,
    appBaseUrl: requestBaseUrl,
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
