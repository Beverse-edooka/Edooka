"use client";

import { useState } from "react";
import {
  buildCertificateShareCaption,
  certificatePngUrl,
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

async function fetchCertificateFile(certificateNumber: string): Promise<File | null> {
  try {
    const res = await fetch(certificatePngUrl(certificateNumber));
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], `edooka-certificate-${certificateNumber}.png`, {
      type: blob.type || "image/png",
    });
  } catch {
    return null;
  }
}

/**
 * LinkedIn: prefer native share (image file + caption). Fallback: share-offsite with the
 * certificate page so LinkedIn embeds the certificate PNG from Open Graph.
 * WhatsApp: caption + share page for certificate preview card.
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
  const waHref = whatsAppShareUrl(caption, sharePageUrl);

  const baseBtn =
    "inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow card-hover sm:px-6 sm:py-3";

  async function onLinkedInClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (linkedInBusy) return;
    setLinkedInBusy(true);

    try {
      const file = await fetchCertificateFile(certificateNumber);

      if (file && typeof navigator !== "undefined" && navigator.share) {
        const payload: ShareData = {
          title: "My Edooka certificate",
          text: caption,
          files: [file],
        };
        if (!navigator.canShare || navigator.canShare(payload)) {
          try {
            await navigator.share(payload);
            return;
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
          }
        }
      }

      window.open(
        linkedInShareOffsiteUrl(sharePageUrl),
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      setLinkedInBusy(false);
    }
  }

  return (
    <div className={`flex w-full max-w-sm flex-col items-stretch gap-3 ${className}`}>
      <button
        type="button"
        disabled={linkedInBusy}
        onClick={(e) => void onLinkedInClick(e)}
        className={`${baseBtn} bg-[#0a66c2] disabled:opacity-70`}
      >
        <span aria-hidden className="font-bold">
          in
        </span>
        {linkedInBusy ? "Opening LinkedIn…" : "Share on LinkedIn"}
      </button>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseBtn} bg-[#25d366]`}
      >
        <span aria-hidden>💬</span>
        Share on WhatsApp
      </a>
    </div>
  );
}
