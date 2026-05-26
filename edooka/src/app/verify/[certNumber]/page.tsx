"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CertificateShareButtons } from "@/components/certificate/ShareButtons";
import { COMPANY_NAME } from "@/lib/site";
import { verifyUrlForCertificate } from "@/lib/app-url";
import { downloadCertificatePng } from "@/lib/download-certificate";

type VerifyResult = {
  valid: boolean;
  certificateNumber?: string;
  holderName?: string;
  programTitle?: string;
  programSlug?: string;
  programCategory?: string;
  issuedAt?: string | null;
  message?: string;
  error?: string;
};

/**
 * Page: Verify — public certificate verification result.
 */
export default function VerifyPage() {
  const params = useParams<{ certNumber: string }>();
  const certNumber = decodeURIComponent(params.certNumber ?? "");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!certNumber) {
      setTimeout(() => {
        setResult({ valid: false, message: "Certificate number is required." });
        setLoading(false);
      }, 0);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(certNumber)}`);
        const data = (await res.json()) as VerifyResult;
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setResult({ valid: false, error: "Could not reach verification service." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [certNumber]);

  const downloadPdf = useCallback(async () => {
    if (!result?.valid || !result.certificateNumber) return;
    setDownloading(true);
    try {
      await downloadCertificatePng({
        certificateNumber: result.certificateNumber,
        fallback: {
          fullName: result.holderName ?? "Learner",
          courseName: result.programTitle ?? "Assessment",
          certificateNumber: result.certificateNumber,
          verifyUrl: verifyUrlForCertificate(result.certificateNumber),
        },
      });
    } finally {
      setDownloading(false);
    }
  }, [result]);

  const issuedLabel =
    result?.issuedAt && !Number.isNaN(Date.parse(result.issuedAt))
      ? new Date(result.issuedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const canShare =
    result?.valid &&
    result.certificateNumber &&
    result.programSlug &&
    result.programTitle;

  return (
    <section className="quiz-shell space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Certificate verification</p>
        <h1 className="text-lg font-extrabold font-mono sm:text-xl">{certNumber.toUpperCase()}</h1>
      </div>

      {loading ? (
        <p className="text-center text-text-muted">Checking certificate…</p>
      ) : result?.valid ? (
        <>
          <article className="rounded-2xl border-2 border-green-500/40 bg-green-50 p-5 space-y-3 text-center sm:p-6">
            <p className="text-4xl">✓</p>
            <h2 className="text-xl font-bold text-green-800">Valid {COMPANY_NAME} certificate</h2>
            <div className="text-sm text-text-secondary space-y-1">
              <p>
                <strong>Holder:</strong> {result.holderName}
              </p>
              <p>
                <strong>Program:</strong> {result.programTitle}
                {result.programCategory ? ` (${result.programCategory})` : ""}
              </p>
              {issuedLabel ? (
                <p>
                  <strong>Issued:</strong> {issuedLabel}
                </p>
              ) : null}
            </div>
          </article>

          {canShare ? (
            <div className="flex flex-col items-center gap-2.5">
              <button
                type="button"
                disabled={downloading}
                onClick={() => void downloadPdf()}
                className="cert-action-btn cert-action-btn-primary disabled:opacity-50"
              >
                {downloading ? "Preparing PDF…" : "Download PDF"}
              </button>
              <CertificateShareButtons
                courseName={result.programTitle!}
                programSlug={result.programSlug!}
                certificateNumber={result.certificateNumber!}
              />
            </div>
          ) : null}
        </>
      ) : (
        <article className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-3 text-center sm:p-6">
          <p className="text-4xl">✕</p>
          <h2 className="text-xl font-bold text-red-800">Certificate not found</h2>
          <p className="text-sm text-text-secondary">
            {result?.message ?? result?.error ?? "This certificate number could not be verified."}
          </p>
        </article>
      )}

      <p className="text-center">
        <Link href="/verify" className="text-sm font-semibold text-primary hover:underline">
          ← Verify another certificate
        </Link>
      </p>
    </section>
  );
}
