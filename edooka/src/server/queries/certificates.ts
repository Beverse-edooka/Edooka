import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates, programs, users } from "@/lib/db/schema";

export type CertificateLookupRow = {
  certificateNumber: string;
  issuedAt: Date | null;
  revoked: boolean;
  holderName: string;
  programTitle: string;
  programSlug: string;
  programCategory: string;
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
    .select({
      certificateNumber: certificates.certificateNumber,
      issuedAt: certificates.issuedAt,
      revoked: certificates.revoked,
      holderName: users.name,
      programTitle: programs.title,
      programSlug: programs.slug,
      programCategory: programs.category,
    })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(programs, eq(certificates.programId, programs.id))
    .where(or(eq(certificates.certificateNumber, upper), eq(certificates.qrToken, lower)))
    .limit(1);

  return rows[0] ?? null;
}
