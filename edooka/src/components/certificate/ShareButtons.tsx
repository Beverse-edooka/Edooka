"use client";

type Props = {
  verifyUrl: string;
  programTitle: string;
  className?: string;
};

export function CertificateShareButtons({ verifyUrl, programTitle, className = "" }: Props) {
  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(
    `I earned my edooka certificate for ${programTitle}! Verify: ${verifyUrl}`
  )}`;

  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
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
