/** 8-char suffix from EDK-2026-XXXXXXXX or pass-through if already a suffix. */
export function extractCertificateSuffix(raw: string): string {
  const trimmed = decodeURIComponent(raw).trim().toUpperCase();
  if (!trimmed) return "";
  if (/^EDK-\d{4}-/i.test(trimmed)) {
    const part = trimmed.split("-").pop() ?? trimmed;
    return part.replace(/[^A-Z0-9]/g, "");
  }
  return trimmed.replace(/[^A-Z0-9]/g, "");
}

export function isLikelyCertificateSuffix(raw: string): boolean {
  const suffix = extractCertificateSuffix(raw);
  return suffix.length >= 4 && suffix.length <= 12;
}
