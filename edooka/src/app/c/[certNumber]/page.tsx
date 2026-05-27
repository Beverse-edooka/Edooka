import Link from "next/link";
import { verifyUrlForCertificate } from "@/lib/app-url";
import { ensureCertificateOgJpeg } from "@/lib/certificate-og-image";
import { assessmentProgramUrl } from "@/lib/share-certificate";
import { getCertificateByNumber } from "@/server/queries/certificates";

type Props = {
  params: Promise<{ certNumber: string }>;
};

/** Short public URL for WhatsApp: /c/EDK-2026-XXXXX (avoids wa.me truncating long links). */
export default async function ShortCertificatePage({ params }: Props) {
  const { certNumber: raw } = await params;
  const certNumber = decodeURIComponent(raw).trim();

  void ensureCertificateOgJpeg(certNumber).catch(() => {});

  const row = await getCertificateByNumber(certNumber).catch(() => null);
  const assessmentHref = row?.programSlug
    ? assessmentProgramUrl(row.programSlug)
    : "/#assessments";

  return (
    <section className="quiz-shell space-y-6 py-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Edooka certificate</p>
      <h1 className="text-2xl font-extrabold">Certificate shared via Edooka</h1>
      <p className="text-sm text-text-secondary">
        Certificate ID <span className="font-mono font-semibold">{certNumber}</span>
      </p>
      <div className="flex flex-col items-center gap-3">
        <Link
          href={verifyUrlForCertificate(certNumber)}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow hover:bg-primary-hover"
        >
          Verify this certificate
        </Link>
        <Link href={assessmentHref} className="text-sm font-semibold text-primary">
          Take your own assessment →
        </Link>
      </div>
    </section>
  );
}
