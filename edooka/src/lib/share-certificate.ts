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

export function certificateSharePageUrl(certificateNumber: string): string {
  const origin = getAppOrigin();
  return `${origin}/share/certificate/${encodeURIComponent(certificateNumber)}`;
}

export function certificatePngUrl(certificateNumber: string): string {
  return `${getAppOrigin()}/api/certificate/png/${encodeURIComponent(certificateNumber)}`;
}

export function certificatePdfDownloadUrl(certificateNumber: string): string {
  return `${certificatePngUrl(certificateNumber)}?download=1`;
}

/**
 * WhatsApp share message.
 *
 * IMPORTANT: WhatsApp previews the FIRST https:// URL in the message.
 * Only the certificate share link may use https — the assessment path is plain
 * text so WhatsApp does not crawl the wrong page and skip the certificate image.
 */
export function buildWhatsAppShareMessage(
  courseName: string,
  programSlug: string,
  certificateNumber: string,
): string {
  const certificateLink = certificateSharePageUrl(certificateNumber);
  const coursePath = assessmentProgramUrl(programSlug).replace(/^https?:\/\//i, "");
  return [
    `I just obtained ${courseName} certificate from Edooka.`,
    `View my Certificate: ${certificateLink}`,
    "",
    `You can get yours here: ${coursePath}`,
  ].join("\n");
}

/** Open Graph title for certificate share pages — e.g. "John's Edooka Certificate". */
export function buildCertificateOpenGraphTitle(holderName: string): string {
  const name = holderName.trim() || "My";
  return `${name}'s Edooka Certificate`;
}

/** Open Graph description for crawlers (WhatsApp, LinkedIn link previews). */
export function buildCertificateOpenGraphDescription(courseName: string): string {
  return `I just completed ${courseName} on Edooka`;
}

/**
 * LinkedIn composer caption — without `https://` so LinkedIn is less likely to
 * replace text with a generic edooka.in link preview card.
 */
export function buildCertificateShareCaptionForLinkedIn(
  courseName: string,
  programSlug: string,
): string {
  const path = assessmentProgramUrl(programSlug).replace(/^https?:\/\//i, "");
  return `I just obtained ${courseName} skill certificate from Edooka. You can get yours here: ${path}`;
}

/**
 * Opens the LinkedIn post composer with the caption pre-filled (`text=`).
 * Do not pass a `url=` param — LinkedIn ignores `text` and only shows a link card.
 */
export function linkedInComposerUrl(caption: string): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(caption)}`;
}

/** WhatsApp — message includes share-page URL so crawlers load certificate Open Graph preview. */
export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
