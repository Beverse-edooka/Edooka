"use client";

import { useState } from "react";
import {
  buildCertificateShareCaption,
  certificateSharePageUrl,
  linkedInShareOffsiteUrl,
  whatsAppShareUrl,
} from "@/lib/share-certificate";

type Props = {
  courseName: string;
  programSlug: string;
  certificateNumber: string;
  className?: string;
};

/**
 * Opens LinkedIn in the browser (never the OS “Share” sheet).
 * Uses share-offsite with the certificate page so LinkedIn shows the certificate
 * image and caption from Open Graph metadata.
 */
export function CertificateShareButtons({
  courseName,
  programSlug,
  certificateNumber,
  className = "",
}: Props) {
  const [linkedInBusy, setLinkedInBusy] = useState(false);

  const caption = buildCertificateShareCaption(courseName, programSlug);
  const sharePageUrl = certificateSharePageUrl(certificateNumber);
  const linkedInHref = linkedInShareOffsiteUrl(sharePageUrl);
  const waHref = whatsAppShareUrl(caption, sharePageUrl);

  function onLinkedInClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (linkedInBusy) return;
    setLinkedInBusy(true);
    window.open(linkedInHref, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setLinkedInBusy(false), 600);
  }

  return (
    <div className={`flex w-full max-w-[15.5rem] flex-col items-stretch gap-2.5 ${className}`}>
      <button
        type="button"
        disabled={linkedInBusy}
        onClick={onLinkedInClick}
        className="cert-action-btn cert-action-btn-linkedin disabled:opacity-70"
      >
        <span aria-hidden className="font-bold">
          in
        </span>
        {linkedInBusy ? "Opening…" : "Share on LinkedIn"}
      </button>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="cert-action-btn cert-action-btn-whatsapp"
      >
        <span aria-hidden>💬</span>
        Share on WhatsApp
      </a>
    </div>
  );
}
