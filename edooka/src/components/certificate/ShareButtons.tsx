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

export function CertificateShareButtons({
  courseName,
  programSlug,
  verifyUrl,
  certificateNumber,
  holderName,
  className = "",
}: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const assessmentLink = assessmentStartUrl(programSlug);
  const sharePageUrl = certificateNumber ? certificateSharePageUrl(certificateNumber) : verifyUrl;
  const pngUrl = certificateNumber ? certificatePngUrl(certificateNumber) : sharePageUrl;
  const previewUrl = certificateNumber ? sharePageUrl : assessmentLink;

  // SAME caption for LinkedIn and WhatsApp.
  const caption = buildCertificateShareMessage(courseName, assessmentLink, holderName);
  // WhatsApp shows a link preview when a URL is part of the message body.
  const whatsAppText = `${caption}\n\n${previewUrl}`;

  const linkedIn = linkedInShareUrl(caption, previewUrl);
  const wa = whatsAppShareUrl(whatsAppText);

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

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(`${caption}\n${previewUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus("Could not copy. Select the text and copy manually.");
    }
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

        {/* Plain anchor — runs synchronously on click so popup blockers don't intercept it. */}
        <a
          href={linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0a66c2] px-5 py-2.5 text-sm font-semibold text-white shadow card-hover sm:px-6 sm:py-3"
        >
          <span aria-hidden>in</span>
          Share on LinkedIn
        </a>

        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-5 py-2.5 text-sm font-semibold text-white shadow card-hover sm:px-6 sm:py-3"
        >
          <span aria-hidden>💬</span>
          Share on WhatsApp
        </a>

        <button
          type="button"
          onClick={() => void copyCaption()}
          className="rounded-xl border border-border-default bg-white px-5 py-2.5 text-sm font-semibold card-hover sm:px-6 sm:py-3"
        >
          {copied ? "Caption copied ✓" : "Copy caption"}
        </button>
      </div>

      {status ? (
        <p className="text-center text-xs text-text-muted sm:text-sm">{status}</p>
      ) : null}

      <p className="text-center text-[11px] leading-snug text-text-muted sm:text-xs">
        The preview card on LinkedIn and WhatsApp uses your certificate image automatically.
        Tip: if you want the certificate as a full post image on LinkedIn, click&nbsp;
        <strong>Download certificate</strong> and attach the PNG manually in LinkedIn.
      </p>
    </div>
  );
}
