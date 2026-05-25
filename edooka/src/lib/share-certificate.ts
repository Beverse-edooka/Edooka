import { getAppOrigin } from "@/lib/app-url";

export function assessmentStartUrl(slug: string): string {
  const origin = getAppOrigin();
  return `${origin}/start/${encodeURIComponent(slug)}`;
}

export function buildCertificateShareText(courseName: string, assessmentLink: string): string {
  return `I just obtained "${courseName}" skill assessment certificate from Edooka. You can get yours here: ${assessmentLink}`;
}

export function linkedInShareUrl(shareText: string, pageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}&summary=${encodeURIComponent(shareText)}`;
}

export function whatsAppShareUrl(shareText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
}

export function certificatePngUrl(certificateNumber: string): string {
  return `${getAppOrigin()}/api/certificate/png/${encodeURIComponent(certificateNumber)}`;
}
