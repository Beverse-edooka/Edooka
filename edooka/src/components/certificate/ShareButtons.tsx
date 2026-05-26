"use client";

import {
  buildCertificateShareCaption,
  certificatePngUrl,
  certificateSharePageUrl,
  linkedInShareUrl,
  whatsAppShareUrl,
} from "@/lib/share-certificate";

type Props = {
  courseName: string;
  programSlug: string;
  certificateNumber: string;
  className?: string;
};

async function fetchCertificateBlob(certificateNumber: string): Promise<Blob | null> {
  try {
    const res = await fetch(certificatePngUrl(certificateNumber));
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

async function copyCertificateImage(blob: Blob): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.write) return false;
  try {
    const type = blob.type || "image/png";
    await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
    return true;
  } catch {
    return false;
  }
}

/**
 * LinkedIn: copy certificate PNG to clipboard, open feed composer with caption in `text=`.
 * WhatsApp: pre-filled caption + share-page URL for certificate OG preview.
 */
export function CertificateShareButtons({
  courseName,
  programSlug,
  certificateNumber,
  className = "",
}: Props) {
  const caption = buildCertificateShareCaption(courseName, programSlug);
  const sharePageUrl = certificateSharePageUrl(certificateNumber);
  const linkedInHref = linkedInShareUrl(caption);
  const waHref = whatsAppShareUrl(caption, sharePageUrl);

  const buttonClass =
    "w-full max-w-sm rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white shadow hover:bg-primary-hover sm:px-6 sm:py-3";

  async function onLinkedInClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const blob = await fetchCertificateBlob(certificateNumber);
    if (blob) await copyCertificateImage(blob);
    window.open(linkedInHref, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={`flex w-full max-w-sm flex-col items-stretch gap-3 ${className}`}>
      <button type="button" onClick={(e) => void onLinkedInClick(e)} className={buttonClass}>
        Share on LinkedIn
      </button>

      <a href={waHref} target="_blank" rel="noopener noreferrer" className={buttonClass}>
        Share on WhatsApp
      </a>
    </div>
  );
}
