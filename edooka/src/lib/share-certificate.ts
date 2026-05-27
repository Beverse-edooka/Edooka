import { getAppOrigin } from "@/lib/app-url";
import { extractCertificateSuffix } from "@/lib/certificate-lookup";

/** Public static OG image — always fast for WhatsApp/Facebook crawlers. */
export function staticCertificateOgImageUrl(): string {
  return `${getAppOrigin()}/og/edooka-certificate-share.jpg`;
}

/** Short hyphen-free share URL — iOS WhatsApp truncates paths with EDK-2026-XXXX. */
export function certificateShortShareUrl(certificateNumber: string): string {
  const suffix = extractCertificateSuffix(certificateNumber);
  const origin = getAppOrigin();
  return `${origin}/c/${encodeURIComponent(suffix)}`;
}

/** Stable OG image URL for WhatsApp crawlers (no cache-buster query string). */
export function certificateOgImageApiUrl(certificateNumber: string): string {
  const suffix = extractCertificateSuffix(certificateNumber);
  return `${getAppOrigin()}/api/og/certificate/${encodeURIComponent(suffix)}`;
}

export function certificatePngUrl(certificateNumber: string): string {
  const suffix = extractCertificateSuffix(certificateNumber);
  return `${getAppOrigin()}/api/certificate/png/${encodeURIComponent(suffix)}`;
}

export function certificatePdfDownloadUrl(certificateNumber: string): string {
  return `${certificatePngUrl(certificateNumber)}?download=1`;
}

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
  const suffix = extractCertificateSuffix(certificateNumber);
  const origin = getAppOrigin();
  return `${origin}/share/certificate/${encodeURIComponent(suffix)}`;
}

/**
 * WhatsApp share message.
 *
 * IMPORTANT: WhatsApp previews the FIRST https:// URL in the message.
 * Only the certificate share link may use https — the assessment path is plain
 * text so WhatsApp does not crawl the wrong page and skip the certificate image.
 */
/**
 * WhatsApp share text.
 * - Certificate URL on line 1 (only https:// in message) so preview targets the cert page.
 * - Assessment path without https so WhatsApp does not crawl the wrong link first.
 */
export function buildWhatsAppShareMessage(
  courseName: string,
  programSlug: string,
  certificateNumber: string,
): string {
  const certificateLink = certificateShortShareUrl(certificateNumber);
  const coursePath = assessmentProgramUrl(programSlug).replace(/^https?:\/\//i, "");
  return [
    certificateLink,
    "",
    `I just obtained ${courseName} certificate from Edooka.`,
    "",
    `You can get yours here: ${coursePath}`,
  ].join("\n");
}

/** Opens WhatsApp with full caption + certificate link (URL first for preview). */
export function whatsAppShareUrl(
  courseName: string,
  programSlug: string,
  certificateNumber: string,
): string {
  const message = buildWhatsAppShareMessage(courseName, programSlug, certificateNumber);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
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

