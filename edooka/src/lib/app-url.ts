/** Canonical site origin for share links, QR codes, and verify URLs (avoids SSR/client mismatch). */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
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
