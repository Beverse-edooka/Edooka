import {
  cashfreeApiBase,
  isDemoPaymentsMode,
  isLiveCashfreeEnabled,
  resolveCashfreeEnvironment,
} from "@/lib/cashfree";

const CASHFREE_API_VERSION = "2023-08-01";

function cleanEnv(value?: string): string {
  if (!value) return "";
  let out = value.trim();
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1).trim();
  }
  return out.replace(/,+$/, "").trim();
}

export function isReferralCoinsOrder(orderId: string): boolean {
  return orderId.startsWith("coins_");
}

/** Client demo query is trusted only when server demo payments mode is enabled. */
export function isTrustedDemoSuccess(orderId: string, demoQuery: boolean): boolean {
  if (isReferralCoinsOrder(orderId)) return true;
  return demoQuery && isDemoPaymentsMode();
}

export type CashfreeOrderLookup =
  | { ok: true; orderStatus: string; paid: boolean }
  | { ok: false; error: string };

export async function fetchCashfreeOrderStatus(orderId: string): Promise<CashfreeOrderLookup> {
  if (!isLiveCashfreeEnabled()) {
    return { ok: false, error: "live_payments_disabled" };
  }

  const appId = cleanEnv(process.env.CASHFREE_APP_ID);
  const secretKey = cleanEnv(process.env.CASHFREE_SECRET_KEY);
  if (!appId || !secretKey) {
    return { ok: false, error: "missing_keys" };
  }

  const env = resolveCashfreeEnvironment(appId);
  const apiBase = cashfreeApiBase(env);

  try {
    const res = await fetch(`${apiBase}/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": CASHFREE_API_VERSION,
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      cache: "no-store",
    });

    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      return { ok: false, error: "invalid_response" };
    }

    if (!res.ok) {
      const message = String(data.message ?? data.error ?? `Cashfree order lookup failed (${res.status})`);
      return { ok: false, error: message };
    }

    const orderStatus = String(data.order_status ?? data.orderStatus ?? "UNKNOWN").toUpperCase();
    const paid = orderStatus === "PAID";
    return { ok: true, orderStatus, paid };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

export async function resolvePaymentPaidForOrder(
  orderId: string,
  demoQuery: boolean
): Promise<{
  paid: boolean;
  orderStatus: string;
  source: "referral_coins" | "demo" | "cashfree" | "unavailable";
  message?: string;
}> {
  if (isTrustedDemoSuccess(orderId, demoQuery)) {
    return { paid: true, orderStatus: "PAID", source: isReferralCoinsOrder(orderId) ? "referral_coins" : "demo" };
  }

  if (isDemoPaymentsMode() && !isLiveCashfreeEnabled()) {
    return { paid: true, orderStatus: "PAID", source: "demo" };
  }

  const lookup = await fetchCashfreeOrderStatus(orderId);
  if (!lookup.ok) {
    return {
      paid: false,
      orderStatus: "UNKNOWN",
      source: "unavailable",
      message: lookup.error,
    };
  }

  return {
    paid: lookup.paid,
    orderStatus: lookup.orderStatus,
    source: "cashfree",
    message: lookup.paid ? undefined : "Payment was not completed.",
  };
}
