import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyUrlForCertificate } from "@/lib/app-url";

type Props = {
  params: Promise<{ certNumber: string }>;
  searchParams: Promise<{ verify?: string }>;
};

/** Public landing for social crawlers; humans can verify or start an assessment. */
export default async function ShareCertificatePage({ params, searchParams }: Props) {
  const { certNumber: raw } = await params;
  const certNumber = decodeURIComponent(raw).trim();
  const sp = await searchParams;
  if (sp.verify === "1") {
    redirect(verifyUrlForCertificate(certNumber));
  }

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
        <Link href="/#assessments" className="text-sm font-semibold text-primary">
          Take your own assessment →
        </Link>
      </div>
    </section>
  );
}
