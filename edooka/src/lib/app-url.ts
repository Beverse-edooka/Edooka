import { cleanEnv } from "@/lib/env-clean";

function ensureHttps(urlOrHost: string): string {
  const value = urlOrHost.trim().replace(/\/$/, "");
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value.replace(/^http:\/\//i, "https://");
  return `https://${value.replace(/^\/+/, "")}`;
}

/** Canonical site origin for share links, QR codes, and verify URLs (avoids SSR/client mismatch). */
export function getAppOrigin(): string {
  const fromEnv = cleanEnv(process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv) return ensureHttps(fromEnv);

  const railwayDomain = cleanEnv(process.env.RAILWAY_PUBLIC_DOMAIN);
  if (railwayDomain) return ensureHttps(railwayDomain);

  const vercelUrl = cleanEnv(process.env.VERCEL_URL);
  if (vercelUrl) return ensureHttps(vercelUrl);

  if (typeof window !== "undefined") return window.location.origin;
  return "https://edooka.in";
}

/**
 * Build a public verify URL. Accepts either a certificate number
 * (e.g. `EDK-2026-00001`) or an opaque qrToken — the `/verify/[token]`
 * route + API resolves both.
 */
export function verifyUrlForCertificate(token: string): string {
  return `${getAppOrigin()}/verify/${encodeURIComponent(token)}`;
}
