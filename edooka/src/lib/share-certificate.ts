import { getAppOrigin } from "@/lib/app-url";

export function assessmentStartUrl(slug: string): string {
  const origin = getAppOrigin();
  return `${origin}/start/${encodeURIComponent(slug)}`;
}

export function buildCertificateShareText(courseName: string, assessmentLink: string): string {
  return `I just obtained "${courseName}" skill assessment certificate from Edooka. You can get yours here: ${assessmentLink}`;
}

/** Single canonical caption used for LinkedIn and WhatsApp (and Web Share). */
export function buildCertificateShareMessage(
  courseName: string,
  assessmentLink: string,
  holderName?: string
): string {
  const greeting = holderName?.trim() ? `Hi! I'm ${holderName.trim()}. ` : "Hi! ";
  return `${greeting}${buildCertificateShareText(courseName, assessmentLink)}`;
}

export function certificateSharePageUrl(certificateNumber: string): string {
  const origin = getAppOrigin();
  return `${origin}/share/certificate/${encodeURIComponent(certificateNumber)}`;
}

/**
 * LinkedIn `share-offsite` only reads the destination URL — it scrapes Open Graph
 * meta tags from that page for the preview card image, title and description.
 * The `summary=` parameter is largely ignored by LinkedIn today, but we still pass it
 * so the user gets prefilled text wherever the API supports it.
 */
export function linkedInShareUrl(shareText: string, pageUrl: string): string {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedSummary = encodeURIComponent(shareText);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedSummary}`;
}

/** WhatsApp shows a link preview for the first URL in the text body. */
export function whatsAppShareUrl(shareText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
}

export function certificatePngUrl(certificateNumber: string): string {
  return `${getAppOrigin()}/api/certificate/png/${encodeURIComponent(certificateNumber)}`;
}

export function certificatePdfDownloadUrl(certificateNumber: string): string {
  return `${certificatePngUrl(certificateNumber)}?download=1`;
}
