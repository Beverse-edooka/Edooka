"use client";

import { useState } from "react";
import {
  assessmentStartUrl,
  buildCertificateShareMessage,
  certificatePngUrl,
  certificateSharePageUrl,
  linkedInShareUrl,
  whatsAppShareUrl,
} from "@/lib/share-certificate";

type Props = {
  courseName: string;
  programSlug: string;
  verifyUrl: string;
  certificateNumber?: string;
  holderName?: string;
  className?: string;
};

/**
 * LinkedIn's URL share endpoint cannot pre-fill the post composer with arbitrary text
 * (the `summary` param is ignored). To still give the user a one-click feel we copy the
 * caption to the clipboard at the same instant the popup is opened, so a single Ctrl+V
 * (or long-press → paste on mobile) drops the same caption into the LinkedIn editor.
 */
export function CertificateShareButtons({
  courseName,
  programSlug,
  verifyUrl,
  certificateNumber,
  holderName,
  className = "",
}: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const assessmentLink = assessmentStartUrl(programSlug);
  const sharePageUrl = certificateNumber ? certificateSharePageUrl(certificateNumber) : verifyUrl;
  const pngUrl = certificateNumber ? certificatePngUrl(certificateNumber) : sharePageUrl;
  const previewUrl = certificateNumber ? sharePageUrl : assessmentLink;

  const caption = buildCertificateShareMessage(courseName, assessmentLink, holderName);
  const whatsAppText = `${caption}\n\n${previewUrl}`;

  const linkedIn = linkedInShareUrl(caption, previewUrl);
  const wa = whatsAppShareUrl(whatsAppText);

  function writeClipboard(text: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(text).catch(() => {
      /* user denied or unsupported — silent fail */
    });
  }

  function openLinkedIn(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    writeClipboard(caption);
    window.open(linkedIn, "_blank", "noopener,noreferrer");
    setStatus("Caption copied — paste it (Ctrl+V) inside the LinkedIn post.");
  }

  function openWhatsApp(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    writeClipboard(whatsAppText);
    window.open(wa, "_blank", "noopener,noreferrer");
    setStatus(null);
  }

  async function fetchCertificateFile(): Promise<File | null> {
    if (!certificateNumber) return null;
    try {
      const res = await fetch(pngUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new File([blob], `edooka-certificate-${certificateNumber}.png`, {
        type: blob.type || "image/png",
      });
    } catch {
      return null;
    }
  }

  async function shareNative() {
    setStatus(null);
    const file = await fetchCertificateFile();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        const payload: ShareData = file
          ? { title: "My Edooka certificate", text: `${caption}\n${previewUrl}`, files: [file] }
          : { title: "My Edooka certificate", text: caption, url: previewUrl };
        if (!file || !navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share(payload);
          return;
        }
      } catch {
        /* user cancelled or browser refused */
      }
    }
    setStatus("Your browser doesn't support direct sharing. Use the LinkedIn or WhatsApp buttons.");
  }

  return (
    <div className={`flex flex-col items-stretch gap-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-3">
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
          rel="noopener noreferrer"
          onClick={openLinkedIn}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0a66c2] px-5 py-2.5 text-sm font-semibold text-white shadow card-hover sm:px-6 sm:py-3"
        >
          <span aria-hidden>in</span>
          Share on LinkedIn
        </a>

        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          onClick={openWhatsApp}
          className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-5 py-2.5 text-sm font-semibold text-white shadow card-hover sm:px-6 sm:py-3"
        >
          <span aria-hidden>💬</span>
          Share on WhatsApp
        </a>
      </div>

      {status ? (
        <p className="text-center text-xs text-text-muted sm:text-sm">{status}</p>
      ) : null}

      <p className="text-center text-[11px] leading-snug text-text-muted sm:text-xs">
        The preview card on LinkedIn and WhatsApp uses your certificate image automatically.
      </p>
    </div>
  );
}
