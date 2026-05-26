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
  const assessmentLink = assessmentStartUrl(programSlug);
  const shareMessage = buildCertificateShareMessage(courseName, assessmentLink, holderName);
  const sharePageUrl = certificateNumber ? certificateSharePageUrl(certificateNumber) : verifyUrl;
  const pngUrl = certificateNumber ? certificatePngUrl(certificateNumber) : sharePageUrl;
  const firstShareUrl = certificateNumber ? sharePageUrl : assessmentLink;

  const linkedIn = linkedInShareUrl(shareMessage, firstShareUrl);
  const wa = whatsAppShareUrl(
    certificateNumber
      ? `${shareMessage}\n\nView my certificate: ${sharePageUrl}\n\nCertificate image: ${pngUrl}`
      : shareMessage
  );

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
    if (navigator.share) {
      try {
        const payload: ShareData = file
          ? { title: "My Edooka certificate", text: `${shareMessage}\n${firstShareUrl}`, files: [file] }
          : { title: "My Edooka certificate", text: shareMessage, url: firstShareUrl };
        if (!file || !navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share(payload);
          return true;
        }
      } catch {
        /* fall through */
      }
    }
    return false;
  }

  async function shareLinkedIn() {
    setStatus(null);
    const file = await fetchCertificateFile();
    if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: "My Edooka certificate",
          text: shareMessage,
          files: [file],
        });
        setStatus("Opened share sheet — pick LinkedIn and add your caption.");
        return;
      } catch {
        /* fallback below */
      }
    }
    window.open(linkedIn, "_blank", "noopener,noreferrer");
    setStatus(
      "LinkedIn opened with your greeting. The link preview shows your certificate image — attach the downloaded PNG from “Download certificate” if you want it in the post."
    );
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
      <button
        type="button"
        onClick={() => void shareLinkedIn()}
        className="rounded-xl border border-border-default px-5 py-2.5 text-sm font-semibold card-hover sm:px-6 sm:py-3"
      >
        Share on LinkedIn
      </button>
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-border-default px-5 py-2.5 text-sm font-semibold card-hover sm:px-6 sm:py-3"
      >
        Share on WhatsApp
      </a>
      {status ? <p className="w-full text-center text-xs text-text-muted sm:text-sm">{status}</p> : null}
      <p className="w-full text-center text-[11px] text-text-muted leading-snug sm:text-xs">
        WhatsApp/LinkedIn preview cards use the first URL in the message. We now share a dedicated certificate page
        URL first so preview thumbnails render correctly.
      </p>
    </div>
  );
}
