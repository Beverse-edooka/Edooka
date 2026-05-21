import { getTierByKey } from "@/lib/pricing";

export type CashfreeCustomer = {
  name?: string;
  email?: string;
  phone?: string;
};

export type CreateCashfreeOrderInput = {
  bundleKey: string;
  attemptId: string;
  customer?: CashfreeCustomer;
};

export type CreateCashfreeOrderResult =
  | { ok: true; orderId: string; paymentLink: string; demo?: boolean; message?: string }
  | { ok: false; status: number; error: string; hint?: string; details?: unknown };

/** Sandbox app ids usually contain TEST; allow override via NEXT_PUBLIC_CASHFREE_MODE. */
export function resolveCashfreeEnvironment(appId: string): "sandbox" | "production" {
  const forced = process.env.NEXT_PUBLIC_CASHFREE_MODE?.trim().toUpperCase();
  if (forced === "PRODUCTION") return "production";
  if (forced === "SANDBOX") return "sandbox";
  return appId.toUpperCase().includes("TEST") ? "sandbox" : "production";
}

function cashfreeApiBase(env: "sandbox" | "production"): string {
  return env === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

function cashfreeCheckoutBase(env: "sandbox" | "production"): string {
  return env === "production" ? "https://payments.cashfree.com" : "https://sandbox.cashfree.com";
}

/** Cashfree: customer_id must be alphanumeric plus _ and - only (no @ or dots). */
function cashfreeCustomerId(attemptId: string, email: string): string {
  const fromAttempt = attemptId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (fromAttempt.length >= 3) return fromAttempt.slice(0, 50);
  const localPart = email.split("@")[0]?.replace(/[^a-zA-Z0-9_-]/g, "") ?? "";
  if (localPart.length >= 3) return localPart.slice(0, 50);
  return `cust_${Date.now()}`.slice(0, 50);
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    const ten = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(ten)) return ten;
  }
  return "9999999999";
}

function normalizeReturnUrl(baseUrl: string, orderId: string, attemptId: string, bundleKey: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const url = new URL(`${base}/success/${encodeURIComponent(orderId)}`);
  url.searchParams.set("attemptId", attemptId);
  url.searchParams.set("bundle", bundleKey);
  return url.toString();
}

export async function createCashfreeOrder(
  input: CreateCashfreeOrderInput
): Promise<CreateCashfreeOrderResult> {
  const tier = getTierByKey(input.bundleKey);
  if (!tier || !input.attemptId.trim()) {
    return { ok: false, status: 400, error: "Invalid bundle or attempt" };
  }

  const customer = input.customer ?? {};
  const email = customer.email?.trim() || "learner@example.com";
  const name = customer.name?.trim() || "Learner";
  const phone = normalizePhone(customer.phone ?? "");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const baseUrl = appUrl || "http://localhost:3000";
  const orderId = `edooka_${input.attemptId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;
  const returnUrl = normalizeReturnUrl(baseUrl, orderId, input.attemptId, input.bundleKey);

  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();

  if (!appId || !secretKey) {
    const demoUrl = `${returnUrl}&demo=1`;
    return {
      ok: true,
      demo: true,
      orderId,
      paymentLink: demoUrl,
      message: "Cashfree keys missing — using demo checkout (no real payment).",
    };
  }

  const env = resolveCashfreeEnvironment(appId);
  const apiBase = cashfreeApiBase(env);

  if (env === "production" && !returnUrl.startsWith("https://")) {
    return {
      ok: false,
      status: 400,
      error: "NEXT_PUBLIC_APP_URL must be HTTPS for live Cashfree payments",
      hint: "Set NEXT_PUBLIC_APP_URL to your production domain (e.g. https://edooka.in) in Vercel/Railway env.",
    };
  }

  let res: Response;
  let rawText = "";
  try {
    res = await fetch(`${apiBase}/orders`, {
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
          customer_id: cashfreeCustomerId(input.attemptId, email),
          customer_email: email,
          customer_phone: phone,
          customer_name: name,
        },
        order_meta: {
          return_url: returnUrl,
        },
      }),
    });
    rawText = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return {
      ok: false,
      status: 502,
      error: `Could not reach Cashfree (${env})`,
      hint: "Check server outbound network and Cashfree status. For testing, remove CASHFREE_APP_ID to use demo mode.",
      details: msg,
    };
  }

  let data: Record<string, unknown> = {};
  try {
    data = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Cashfree returned a non-JSON response",
      hint:
        env === "sandbox"
          ? "Use sandbox keys (App ID contains TEST) or set NEXT_PUBLIC_CASHFREE_MODE=SANDBOX"
          : "Use production keys and NEXT_PUBLIC_CASHFREE_MODE=PRODUCTION",
      details: rawText.slice(0, 300),
    };
  }

  if (!res.ok) {
    const message =
      (data.message as string) ||
      (data.error as string) ||
      `Cashfree order failed (${res.status})`;
    const hint =
      env === "sandbox"
        ? "Confirm CASHFREE_APP_ID / CASHFREE_SECRET_KEY are sandbox (TEST…) keys and NEXT_PUBLIC_CASHFREE_MODE is SANDBOX or unset."
        : "Confirm production keys match NEXT_PUBLIC_CASHFREE_MODE=PRODUCTION and return URL is HTTPS.";
    return { ok: false, status: 502, error: message, hint, details: data };
  }

  const paymentSessionId = data.payment_session_id as string | undefined;
  if (!paymentSessionId) {
    return {
      ok: false,
      status: 502,
      error: "Cashfree did not return payment_session_id",
      hint: "Verify API version 2023-08-01 and PG keys from Cashfree dashboard → Developers.",
      details: data,
    };
  }

  const checkoutBase = cashfreeCheckoutBase(env);
  const paymentLink = `${checkoutBase}/pg/checkout?payment_session_id=${encodeURIComponent(paymentSessionId)}`;

  return { ok: true, orderId, paymentLink };
}
