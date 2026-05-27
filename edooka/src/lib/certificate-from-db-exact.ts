import { verifyUrlForCertificate } from "@/lib/app-url";
import { db } from "@/lib/db";
import { certificates, programs, users } from "@/lib/db/schema";
import type { CertificateRenderInput } from "@/lib/certificate-template";
import { eq } from "drizzle-orm";

/** Exact certificate_number match only (internal use after resolve). */
export async function getCertificateRenderInputFromDbExact(
  certificateNumber: string,
): Promise<CertificateRenderInput | null> {
  const normalized = certificateNumber.trim().toUpperCase();
  if (!normalized) return null;

  const [row] = await db
    .select({ cert: certificates, user: users, program: programs })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(programs, eq(certificates.programId, programs.id))
    .where(eq(certificates.certificateNumber, normalized))
    .limit(1);

  if (!row) return null;

  const { cert, user, program } = row;
  const verifyUrl =
    cert.verificationUrl?.trim() ||
    verifyUrlForCertificate(cert.qrToken ?? cert.certificateNumber);

  return {
    fullName: user.name,
    courseName: program.title,
    certificateNumber: cert.certificateNumber,
    verifyUrl,
  };
}
