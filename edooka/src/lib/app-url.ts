/** Canonical site origin for share links, QR codes, and verify URLs (avoids SSR/client mismatch). */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://edooka.in";
}

export function verifyUrlForCertificate(certificateNumber: string): string {
  return `${getAppOrigin()}/verify/${encodeURIComponent(certificateNumber)}`;
}
