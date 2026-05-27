import { verifyUrlForCertificate } from "@/lib/app-url";
import type { CertificateRenderInput } from "@/lib/certificate-template";
import { resolveCertificateNumber } from "@/server/queries/certificates";
import { getCertificateRenderInputFromDbExact } from "@/lib/certificate-from-db-exact";

/** Load canonical certificate render fields from Postgres (single source of truth on server). */
export async function getCertificateRenderInputFromDb(
  certificateNumber: string,
): Promise<CertificateRenderInput | null> {
  const resolved = await resolveCertificateNumber(certificateNumber);
  if (!resolved) return null;
  return getCertificateRenderInputFromDbExact(resolved);
}
