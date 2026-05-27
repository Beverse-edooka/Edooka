import { eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates, programs, users } from "@/lib/db/schema";
import { extractCertificateSuffix } from "@/lib/certificate-lookup";

export type CertificateLookupRow = {
  certificateNumber: string;
  issuedAt: Date | null;
  revoked: boolean;
  holderName: string;
  programTitle: string;
  programSlug: string;
  programCategory: string;
};

const lookupSelect = {
  certificateNumber: certificates.certificateNumber,
  issuedAt: certificates.issuedAt,
  revoked: certificates.revoked,
  holderName: users.name,
  programTitle: programs.title,
  programSlug: programs.slug,
  programCategory: programs.category,
};

/** Resolve a certificate by human-readable number or QR token. */
export async function getCertificateByNumber(
  raw: string,
): Promise<CertificateLookupRow | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  const rows = await db
    .select(lookupSelect)
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(programs, eq(certificates.programId, programs.id))
    .where(or(eq(certificates.certificateNumber, upper), eq(certificates.qrToken, lower)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Resolve full certificate from any share/verify key:
 * full number, QR token, 8-char suffix, or truncated suffix (iOS WhatsApp cuts hyphens).
 */
export async function resolveCertificate(
  raw: string,
): Promise<CertificateLookupRow | null> {
  const exact = await getCertificateByNumber(raw);
  if (exact) return exact;

  const suffix = extractCertificateSuffix(raw);
  if (suffix.length < 4) return null;

  const pattern = `%${suffix}%`;
  const candidates = await db
    .select(lookupSelect)
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(programs, eq(certificates.programId, programs.id))
    .where(sql`upper(${certificates.certificateNumber}) like ${pattern.toUpperCase()}`)
    .limit(5);

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;

  const endsWith = candidates.filter((c) =>
    c.certificateNumber.toUpperCase().endsWith(suffix),
  );
  if (endsWith.length === 1) return endsWith[0]!;

  const containsSuffix = candidates.filter((c) => {
    const s = extractCertificateSuffix(c.certificateNumber);
    return s.startsWith(suffix) || suffix.startsWith(s);
  });
  if (containsSuffix.length === 1) return containsSuffix[0]!;

  return null;
}

/** Canonical certificate number after resolving a share key, or null. */
export async function resolveCertificateNumber(raw: string): Promise<string | null> {
  const row = await resolveCertificate(raw);
  return row?.certificateNumber ?? null;
}
