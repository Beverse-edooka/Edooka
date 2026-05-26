"use client";

import { useEffect, useRef, useState } from "react";
import { copyCertificatePngToClipboard } from "@/lib/copy-certificate-clipboard";
import {
  buildCertificateShareCaption,
  buildCertificateShareCaptionForLinkedIn,
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

/**
 * LinkedIn: pre-fill caption, copy certificate PNG (preloaded) before opening the tab.
 */
export function CertificateShareButtons({
  courseName,
  programSlug,
  certificateNumber,
  className = "",
}: Props) {
  const [linkedInBusy, setLinkedInBusy] = useState(false);
  const [linkedInHint, setLinkedInHint] = useState<string | null>(null);
  const pngBlobRef = useRef<Blob | null>(null);

  const caption = buildCertificateShareCaption(courseName, programSlug);
  const linkedInCaption = buildCertificateShareCaptionForLinkedIn(courseName, programSlug);
  const sharePageUrl = certificateSharePageUrl(certificateNumber);
  const waHref = whatsAppShareUrl(caption, sharePageUrl);
  const pngUrl = certificatePngUrl(certificateNumber);

  useEffect(() => {
    let cancelled = false;
    pngBlobRef.current = null;

    void fetch(pngUrl)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!cancelled && blob) pngBlobRef.current = blob;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pngUrl]);

  async function onLinkedInClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (linkedInBusy) return;
    setLinkedInBusy(true);
    setLinkedInHint(null);

    try {
      let blob = pngBlobRef.current;
      if (!blob) {
        const res = await fetch(pngUrl);
        if (res.ok) {
          blob = await res.blob();
          pngBlobRef.current = blob;
        }
      }

      let copied = false;
      if (blob) {
        copied = await copyCertificatePngToClipboard(blob);
      }

      if (copied) {
        setLinkedInHint(
          "Certificate image copied. In LinkedIn, click the photo icon, then press Ctrl+V.",
        );
      } else {
        window.open(pngUrl, "_blank", "noopener,noreferrer");
        setLinkedInHint(
          "Could not copy automatically. Your certificate opened in a new tab — drag it into the LinkedIn post.",
        );
      }

      window.open(linkedInComposerUrl(linkedInCaption), "_blank", "noopener,noreferrer");
    } finally {
      window.setTimeout(() => setLinkedInBusy(false), 800);
      window.setTimeout(() => setLinkedInHint(null), 12_000);
    }
  }

  return (
    <div className={`flex w-full max-w-[15.5rem] flex-col items-stretch gap-2.5 ${className}`}>
      <button
        type="button"
        disabled={linkedInBusy}
        onClick={(e) => void onLinkedInClick(e)}
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

      {linkedInHint ? (
        <p className="text-center text-[11px] leading-snug text-text-muted">{linkedInHint}</p>
      ) : null}
    </div>
  );
}
