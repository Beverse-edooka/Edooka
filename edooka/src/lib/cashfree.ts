import { getTierByKey } from "@/lib/pricing";

export type CashfreeCustomer = {
  name?: string;
  email?: string;
  phone?: string;
};

export type CreateCashfreeOrderInput = {
  bundleKey: string;
  attemptId: string;
  /** Program slug — included on the payment return URL so success can hydrate after redirect. */
  programSlug?: string;
  customer?: CashfreeCustomer;
  appBaseUrl?: string;
};

export type CreateCashfreeOrderResult =
  | {
      ok: true;
      orderId: string;
      paymentLink: string;
      paymentSessionId?: string;
      demo?: boolean;
      message?: string;
    }
  | { ok: false; status: number; error: string; hint?: string; details?: unknown };

/**
 * Use the broadly supported Payments API version for PG `/orders`.
 * Newer versions can return "endpoint or method is not valid" on some accounts.
 */
const CASHFREE_API_VERSION = "2023-08-01";

/**
 * Railway/Vercel dashboards sometimes store values with quotes, trailing commas,
 * or accidental whitespace/newlines. Normalize to avoid false mode/key mismatch.
 */
function cleanEnv(value?: string): string {
  if (!value) return "";
  let out = value.trim();
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1).trim();
  }
  out = out.replace(/,+$/, "").trim();
  return out;
}

/** Sandbox app ids usually contain TEST; allow override via NEXT_PUBLIC_CASHFREE_MODE. */
export function resolveCashfreeEnvironment(appId: string): "sandbox" | "production" {
  const forced = cleanEnv(process.env.NEXT_PUBLIC_CASHFREE_MODE).toUpperCase();
  if (forced === "PRODUCTION") return "production";
  if (forced === "SANDBOX" || forced === "TEST") return "sandbox";
  return appId.toUpperCase().includes("TEST") ? "sandbox" : "production";
}

/** Demo checkout when keys are absent or DEMO mode is forced in env. */
export function isDemoPaymentsMode(): boolean {
  const mode = cleanEnv(process.env.NEXT_PUBLIC_CASHFREE_MODE).toUpperCase();
  if (mode === "DEMO") return true;
  if (cleanEnv(process.env.EDOOKA_DEMO_PAYMENTS) === "1") return true;
  return false;
}

/** Live Cashfree only when explicitly enabled — default is demo checkout. */
export function isLiveCashfreeEnabled(): boolean {
  if (isDemoPaymentsMode()) return false;
  if (cleanEnv(process.env.CASHFREE_LIVE_PAYMENTS) !== "1") return false;
  const appId = cleanEnv(process.env.CASHFREE_APP_ID);
  const secretKey = cleanEnv(process.env.CASHFREE_SECRET_KEY);
  return Boolean(appId && secretKey);
}

function cashfreeResponseIndicatesFailure(data: Record<string, unknown>): boolean {
  const type = String(data.type ?? "");
  const code = String(data.code ?? "");
  const message = String(data.message ?? data.error ?? "").toLowerCase();
  return (
    type === "api_connection_error" ||
    code === "request_failed" ||
    message.includes("endpoint or method is not valid") ||
    message.includes("endpoint or method")
  );
}

export function cashfreeApiBase(env: "sandbox" | "production"): string {
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

function normalizeReturnUrl(
  baseUrl: string,
  orderId: string,
  attemptId: string,
  bundleKey: string,
  programSlug?: string
): string {
  const base = baseUrl.replace(/\/$/, "");
  const url = new URL(`${base}/success/${encodeURIComponent(orderId)}`);
  url.searchParams.set("attemptId", attemptId);
  url.searchParams.set("bundle", bundleKey);
  const slug = programSlug?.trim();
  if (slug) url.searchParams.set("slug", slug);
  return url.toString();
}

function demoOrderResult(
  orderId: string,
  returnUrl: string,
  message?: string
): CreateCashfreeOrderResult {
  const demoUrl = `${returnUrl}&demo=1`;
  return {
    ok: true,
    demo: true,
    orderId,
    paymentLink: demoUrl,
    message: message ?? "Demo checkout — no Cashfree payment.",
  };
}

function shouldFallbackToDemo(data: Record<string, unknown>): boolean {
  if (!isLiveCashfreeEnabled()) return true;
  return cashfreeResponseIndicatesFailure(data);
}

function cashfreeErrorMessage(data: Record<string, unknown>, status: number): string {
  const message = (data.message as string) || (data.error as string);
  if (message) return message;
  const type = data.type as string | undefined;
  if (type === "api_connection_error") {
    return "Cashfree connection failed — check API keys and sandbox vs production mode.";
  }
  return `Cashfree order failed (${status})`;
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

  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL);
  const baseUrl = input.appBaseUrl?.trim() || appUrl || "http://localhost:3000";
  const orderId = `edooka_${input.attemptId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;
  const returnUrl = normalizeReturnUrl(
    baseUrl,
    orderId,
    input.attemptId,
    input.bundleKey,
    input.programSlug
  );

  if (!isLiveCashfreeEnabled()) {
    return demoOrderResult(
      orderId,
      returnUrl,
      "Demo checkout — set CASHFREE_LIVE_PAYMENTS=1 with valid keys for live Cashfree."
    );
  }

  const appId = cleanEnv(process.env.CASHFREE_APP_ID);
  const secretKey = cleanEnv(process.env.CASHFREE_SECRET_KEY);

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
        "x-api-version": CASHFREE_API_VERSION,
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
  } catch {
    return demoOrderResult(orderId, returnUrl, "Cashfree unreachable — using demo checkout.");
  }

  let data: Record<string, unknown> = {};
  try {
    data = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
  } catch {
    return demoOrderResult(orderId, returnUrl, "Cashfree returned invalid JSON — using demo checkout.");
  }

  if (cashfreeResponseIndicatesFailure(data)) {
    return demoOrderResult(orderId, returnUrl, "Cashfree rejected the request — using demo checkout.");
  }

  if (!res.ok) {
    if (shouldFallbackToDemo(data)) {
      return demoOrderResult(
        orderId,
        returnUrl,
        "Cashfree API error — using demo checkout. Set EDOOKA_DEMO_PAYMENTS=1 to skip live payment, or fix keys and NEXT_PUBLIC_CASHFREE_MODE."
      );
    }
    const message = cashfreeErrorMessage(data, res.status);
    const hint =
      env === "sandbox"
        ? "Confirm CASHFREE_APP_ID / CASHFREE_SECRET_KEY are sandbox (TEST…) keys and NEXT_PUBLIC_CASHFREE_MODE is SANDBOX or unset."
        : "Confirm production keys match NEXT_PUBLIC_CASHFREE_MODE=PRODUCTION and return URL is HTTPS.";
    return { ok: false, status: 502, error: message, hint, details: data };
  }

  const paymentSessionId =
    (data.payment_session_id as string | undefined) ||
    (data.payment_sessions_id as string | undefined);
  if (!paymentSessionId) {
    if (shouldFallbackToDemo(data)) {
      return demoOrderResult(orderId, returnUrl, "Cashfree did not return a session — using demo checkout.");
    }
    return {
      ok: false,
      status: 502,
      error: "Cashfree did not return payment_session_id",
      hint: `Verify API version ${CASHFREE_API_VERSION} and PG keys from Cashfree dashboard → Developers.`,
      details: data,
    };
  }

  // Old query-string checkout URLs can fail with
  // "endpoint or method is not valid" on some accounts.
  // Route through our own page that submits the hosted session form.
  const paymentLink = `${baseUrl.replace(/\/$/, "")}/cashfree/checkout?session=${encodeURIComponent(paymentSessionId)}&env=${env}`;

  return { ok: true, orderId, paymentLink, paymentSessionId };
}
