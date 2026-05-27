"use client";

import { useEffect, useRef, useState } from "react";
import { copyCertificatePngToClipboard } from "@/lib/copy-certificate-clipboard";
import {
  buildCertificateShareCaptionForLinkedIn,
  certificateOgImageApiUrl,
  certificatePngUrl,
  linkedInComposerUrl,
  whatsAppShareUrl,
} from "@/lib/share-certificate";

type Props = {
  courseName: string;
  programSlug: string;
  certificateNumber: string;
  className?: string;
};

export function CertificateShareButtons({
  courseName,
  programSlug,
  certificateNumber,
  className = "",
}: Props) {
  const [linkedInBusy, setLinkedInBusy] = useState(false);
  const [linkedInHint, setLinkedInHint] = useState<string | null>(null);
  const pngBlobRef = useRef<Blob | null>(null);

  const certId = certificateNumber.trim();
  const linkedInCaption = buildCertificateShareCaptionForLinkedIn(courseName, programSlug);
  const pngUrl = certificatePngUrl(certId);

  useEffect(() => {
    let cancelled = false;
    pngBlobRef.current = null;

    if (!certId) return;

    void fetch(pngUrl)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!cancelled && blob) pngBlobRef.current = blob;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [certId, pngUrl]);

  async function onLinkedInClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (linkedInBusy || !certId) return;
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
      if (blob) copied = await copyCertificatePngToClipboard(blob);

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

  function onWhatsAppClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!certId) return;

    void fetch(certificateOgImageApiUrl(certId)).catch(() => {});
    window.open(whatsAppShareUrl(courseName, programSlug, certId), "_blank", "noopener,noreferrer");
  }

  return (
    <div className={`flex w-full max-w-[15.5rem] flex-col items-stretch gap-2.5 ${className}`}>
      <button
        type="button"
        disabled={linkedInBusy || !certId}
        onClick={(e) => void onLinkedInClick(e)}
        className="cert-action-btn cert-action-btn-linkedin disabled:opacity-70"
      >
        <span aria-hidden className="font-bold">
          in
        </span>
        {linkedInBusy ? "Opening…" : "Share on LinkedIn"}
      </button>

      <button
        type="button"
        disabled={!certId}
        onClick={onWhatsAppClick}
        className="cert-action-btn cert-action-btn-whatsapp disabled:opacity-70"
      >
        <span aria-hidden>💬</span>
        Share on WhatsApp
      </button>

      {linkedInHint ? (
        <p className="text-center text-[11px] leading-snug text-text-muted">{linkedInHint}</p>
      ) : null}
    </div>
  );
}
