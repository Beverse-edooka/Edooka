"use client";

import { useState } from "react";
import {
  buildCertificateShareCaption,
  certificatePngUrl,
  certificateSharePageUrl,
  linkedInComposerUrl,
  whatsAppShareUrl,
} from "@/lib/share-certificate";

type Props = {
  courseName: string;
  programSlug: string;
  certificateNumber: string;
  className?: string;
};

async function copyCertificateImageToClipboard(certificateNumber: string): Promise<void> {
  const res = await fetch(certificatePngUrl(certificateNumber));
  if (!res.ok) return;
  const blob = await res.blob();
  if (typeof navigator === "undefined" || !navigator.clipboard?.write) return;
  const type = blob.type || "image/png";
  await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
}

/**
 * LinkedIn: pre-fill caption via `text=` (not share-offsite `url=`), copy certificate PNG
 * to clipboard so the user can paste (Ctrl+V) it into the post as a photo.
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

  async function onLinkedInClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (linkedInBusy) return;
    setLinkedInBusy(true);

    try {
      try {
        await copyCertificateImageToClipboard(certificateNumber);
      } catch {
        /* clipboard denied or unsupported — still open LinkedIn with caption */
      }
      window.open(linkedInComposerUrl(caption), "_blank", "noopener,noreferrer");
    } finally {
      window.setTimeout(() => setLinkedInBusy(false), 800);
    }
  }

  return (
    <div className={`flex w-full max-w-[15.5rem] flex-col items-stretch gap-2.5 ${className}`}>
      <button
        type="button"
        disabled={linkedInBusy}
        onClick={(e) => void onLinkedInClick(e)}
        className="cert-action-btn cert-action-btn-linkedin disabled:opacity-70"
        title="Caption is filled automatically; certificate image is copied — paste it in the post with Ctrl+V"
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
