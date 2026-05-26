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

/**
 * LinkedIn composer caption — same message but without `https://` so LinkedIn is less
 * likely to replace your text with a generic edooka.in link preview card.
 */
export function buildCertificateShareCaptionForLinkedIn(
  courseName: string,
  programSlug: string,
): string {
  const path = assessmentProgramUrl(programSlug).replace(/^https?:\/\//i, "");
  return `I just obtained ${courseName} skill certificate from Edooka. You can get yours here: ${path}`;
}

export function certificateSharePageUrl(certificateNumber: string): string {
  const origin = getAppOrigin();
  return `${origin}/share/certificate/${encodeURIComponent(certificateNumber)}`;
}

/**
 * Opens the LinkedIn post composer with the caption pre-filled (`text=`).
 * Do not pass a `url=` param — LinkedIn ignores `text` and only shows a link card (blank caption).
 */
export function linkedInComposerUrl(caption: string): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(caption)}`;
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
