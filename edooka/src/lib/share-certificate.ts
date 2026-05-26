import { getAppOrigin } from "@/lib/app-url";

/** Public assessments listing for a program — used in share captions. */
export function assessmentProgramUrl(slug: string): string {
  const origin = getAppOrigin();
  return `${origin}/assessments/${encodeURIComponent(slug)}`;
}

/** @deprecated Use assessmentProgramUrl — kept for any legacy /start links */
export function assessmentStartUrl(slug: string): string {
  const origin = getAppOrigin();
  return `${origin}/start/${encodeURIComponent(slug)}`;
}

export function buildCertificateShareCaption(courseName: string, programSlug: string): string {
  const assessmentLink = assessmentProgramUrl(programSlug);
  return `I just obtained ${courseName} skill certificate from Edooka. You can get yours here: ${assessmentLink}`;
}

export function certificateSharePageUrl(certificateNumber: string): string {
  const origin = getAppOrigin();
  return `${origin}/share/certificate/${encodeURIComponent(certificateNumber)}`;
}

/**
 * LinkedIn link share — scrapes Open Graph from the share page (certificate PNG as og:image).
 * Use this instead of `feed/?shareActive=true&text=` when the caption contains assessment URLs,
 * which otherwise trigger a generic edooka.in preview instead of the certificate image.
 */
export function linkedInShareOffsiteUrl(sharePageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(sharePageUrl)}`;
}

/** WhatsApp message: caption + share page URL for certificate Open Graph preview. */
export function whatsAppShareUrl(caption: string, previewPageUrl: string): string {
  const body = previewPageUrl ? `${caption}\n\n${previewPageUrl}` : caption;
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}

export function certificatePngUrl(certificateNumber: string): string {
  return `${getAppOrigin()}/api/certificate/png/${encodeURIComponent(certificateNumber)}`;
}

export function certificatePdfDownloadUrl(certificateNumber: string): string {
  return `${certificatePngUrl(certificateNumber)}?download=1`;
}
