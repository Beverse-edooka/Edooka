import { getAppOrigin } from "@/lib/app-url";

export function assessmentStartUrl(slug: string): string {
  const origin = getAppOrigin();
  return `${origin}/start/${encodeURIComponent(slug)}`;
}

export function buildCertificateShareText(courseName: string, assessmentLink: string): string {
  return `I just obtained "${courseName}" skill assessment certificate from Edooka. You can get yours here: ${assessmentLink}`;
}

/** WhatsApp-style greeting + caption (used for LinkedIn text and WhatsApp messages). */
export function buildCertificateShareMessage(
  courseName: string,
  assessmentLink: string,
  holderName?: string
): string {
  const greeting = holderName?.trim()
    ? `Hi! I'm ${holderName.trim()}. `
    : "Hi! ";
  return `${greeting}${buildCertificateShareText(courseName, assessmentLink)}`;
}

export function certificateSharePageUrl(certificateNumber: string): string {
  const origin = getAppOrigin();
  return `${origin}/share/certificate/${encodeURIComponent(certificateNumber)}`;
}

export function linkedInShareUrl(shareText: string, pageUrl: string): string {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedSummary = encodeURIComponent(shareText);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedSummary}`;
}

export function whatsAppShareUrl(shareText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
}

export function certificatePngUrl(certificateNumber: string): string {
  return `${getAppOrigin()}/api/certificate/png/${encodeURIComponent(certificateNumber)}`;
}

export function certificatePdfDownloadUrl(certificateNumber: string): string {
  return certificatePngUrl(certificateNumber);
}
