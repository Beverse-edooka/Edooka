"use client";

import {
  assessmentStartUrl,
  buildCertificateShareText,
  certificatePngUrl,
  linkedInShareUrl,
  whatsAppShareUrl,
} from "@/lib/share-certificate";
import { getAppOrigin } from "@/lib/app-url";

type Props = {
  courseName: string;
  programSlug: string;
  verifyUrl: string;
  certificateNumber?: string;
  className?: string;
};

export function CertificateShareButtons({
  courseName,
  programSlug,
  verifyUrl,
  certificateNumber,
  className = "",
}: Props) {
  const assessmentLink = assessmentStartUrl(programSlug);
  const shareText = buildCertificateShareText(courseName, assessmentLink);
  const pageUrl = verifyUrl || getAppOrigin();
  const pngUrl = certificateNumber ? certificatePngUrl(certificateNumber) : pageUrl;

  const linkedIn = linkedInShareUrl(shareText, pageUrl);
  const waText = certificateNumber
    ? `${shareText}\n\nView my certificate: ${pngUrl}`
    : shareText;
  const wa = whatsAppShareUrl(waText);

  async function shareNative() {
    if (!navigator.share) return false;
    const payload: ShareData = {
      title: "My Edooka certificate",
      text: shareText,
      url: pageUrl,
    };
    try {
      await navigator.share(payload);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <div className={`flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center ${className}`}>
      <button
        type="button"
        onClick={() => void shareNative()}
        className="rounded-xl border border-primary/40 bg-white px-5 py-2.5 text-sm font-semibold text-primary card-hover sm:px-6 sm:py-3"
      >
        Share…
      </button>
      <a
        href={linkedIn}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-border-default px-5 py-2.5 text-sm font-semibold card-hover sm:px-6 sm:py-3"
      >
        Share on LinkedIn
      </a>
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-border-default px-5 py-2.5 text-sm font-semibold card-hover sm:px-6 sm:py-3"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}
