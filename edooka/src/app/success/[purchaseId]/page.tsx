"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { motion } from "framer-motion";
import { CertificateDocument } from "@/components/pdf/CertificateDocument";
import { verifyUrlForCertificate } from "@/lib/app-url";
import { certificateNumberForAttempt } from "@/lib/certificate";
import { addCreditsFromPurchase, redeemCertificateCredit } from "@/lib/certificate-wallet";
import { getCertificateCountForBundle } from "@/lib/pricing";
import { getProgramBySlug } from "@/data/programs";
import { normalizeLearnerAttempt } from "@/lib/learner";
import { EDOOKA_ATTEMPT_KEY, readLearnerProfile, type ActiveAttempt } from "@/lib/session-keys";

function SuccessInner() {
  const params = useParams<{ purchaseId: string }>();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get("attemptId") ?? "";
  const bundleKey = searchParams.get("bundle") ?? "single";
  const demo = searchParams.get("demo") === "1";
  const certificateCredits = getCertificateCountForBundle(bundleKey);

  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "skipped" | "error">("idle");
  const [issuedDateLabel, setIssuedDateLabel] = useState("");
  const [shareUrls, setShareUrls] = useState<{ linkedIn: string; wa: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    addCreditsFromPurchase(params.purchaseId, certificateCredits);
  }, [params.purchaseId, certificateCredits]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let loaded: ActiveAttempt | null = null;
    const raw = sessionStorage.getItem(EDOOKA_ATTEMPT_KEY);
    if (raw) {
      try {
        const data = normalizeLearnerAttempt(JSON.parse(raw) as ActiveAttempt);
        if (data.attemptId === attemptIdParam) loaded = data;
      } catch {
        /* ignore */
      }
    }
    if (!loaded && attemptIdParam) {
      const fromDisk = readLearnerProfile(attemptIdParam);
      if (fromDisk) loaded = normalizeLearnerAttempt(fromDisk);
    }
    if (loaded) setAttempt(loaded);
  }, [attemptIdParam]);

  const program = useMemo(
    () => (attempt?.slug ? getProgramBySlug(attempt.slug) : undefined),
    [attempt?.slug]
  );

  const certNumber = useMemo(
    () => certificateNumberForAttempt(attemptIdParam || attempt?.attemptId || params.purchaseId),
    [attempt?.attemptId, attemptIdParam, params.purchaseId]
  );

  const recipientName = attempt?.name ?? "Learner";
  const programTitle = attempt?.programTitle || program?.title || "Healthcare assessment";
  const verifyUrl = useMemo(() => verifyUrlForCertificate(certNumber), [certNumber]);

  useEffect(() => {
    setIssuedDateLabel(
      new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    setShareUrls({
      linkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`,
      wa: `https://wa.me/?text=${encodeURIComponent(
        `I earned my edooka certificate for ${programTitle}! Verify: ${verifyUrl}`
      )}`,
    });
  }, [verifyUrl, programTitle]);

  const downloadPdf = useCallback(async () => {
    const attemptId = attemptIdParam || attempt?.attemptId;
    if (attemptId && attempt?.slug) {
      redeemCertificateCredit({
        attemptId,
        slug: attempt.slug,
        programTitle,
        purchaseId: params.purchaseId,
      });
    }
    const blob = await pdf(
      <CertificateDocument
        recipientName={recipientName}
        programTitle={programTitle}
        certificateNumber={certNumber}
        issuedDateLabel={issuedDateLabel || "—"}
        verifyUrl={verifyUrl}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edooka-certificate-${certNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [recipientName, programTitle, certNumber, issuedDateLabel, verifyUrl]);

  useEffect(() => {
    if (!attempt?.email || !issuedDateLabel) return;
    const storageKey = `edooka_cert_email_${params.purchaseId}`;
    if (sessionStorage.getItem(storageKey)) {
      setEmailStatus("sent");
      return;
    }
    setEmailStatus("sending");
    void fetch("/api/certificate/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: attempt.email,
        recipientName,
        programTitle,
        certificateNumber: certNumber,
        issuedDateLabel,
        verifyUrl,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { skipped?: boolean; ok?: boolean };
        if (data.skipped) setEmailStatus("skipped");
        else if (res.ok) {
          setEmailStatus("sent");
          sessionStorage.setItem(storageKey, "1");
        } else setEmailStatus("error");
      })
      .catch(() => setEmailStatus("error"));
  }, [attempt, certNumber, issuedDateLabel, params.purchaseId, programTitle, recipientName, verifyUrl]);

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border-default bg-white p-8 shadow-[0_14px_36px_rgba(255,149,88,0.22)] text-center space-y-4"
      >
        <p className="text-4xl">🏆</p>
        <h1 className="text-3xl font-extrabold">Payment confirmed</h1>
        <p className="text-text-secondary">
          {demo ? "Demo mode — no payment processed. " : null}
          Your certificate is ready. A PDF copy is sent to your email when mail is configured.
        </p>
        <p className="text-sm text-text-muted font-mono">Order ref · {params.purchaseId}</p>
        <p className="text-sm text-primary font-semibold">
          Your plan includes {certificateCredits} certificate download
          {certificateCredits > 1 ? "s" : ""} (use now or later).
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border-2 border-primary/25 bg-soft-orange p-8 space-y-4 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Certificate of achievement</p>
        <p className="text-sm text-text-muted">Presented to</p>
        <p className="text-3xl font-extrabold text-foreground">{recipientName}</p>
        <p className="text-sm text-text-secondary">
          for completing <strong>{programTitle}</strong>
        </p>
        <p className="text-xs text-text-muted pt-2">
          {certNumber} · {issuedDateLabel}
        </p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => void downloadPdf()}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow"
        >
          Download PDF
        </motion.button>
        {shareUrls ? (
          <>
            <a
              href={shareUrls.linkedIn}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border-default px-6 py-3 font-semibold card-hover"
            >
              Share on LinkedIn
            </a>
            <a
              href={shareUrls.wa}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border-default px-6 py-3 font-semibold card-hover"
            >
              Share on WhatsApp
            </a>
          </>
        ) : null}
      </div>

      <p className="text-center text-sm text-text-muted">
        Email delivery:{" "}
        {emailStatus === "sending" && "Sending PDF…"}
        {emailStatus === "sent" && "✓ Sent to your inbox"}
        {emailStatus === "skipped" && "Configure RESEND_API_KEY to enable automatic email."}
        {emailStatus === "error" && "Could not send email — use Download PDF instead."}
        {emailStatus === "idle" && attempt?.email ? "Preparing…" : !attempt?.email ? "Session missing — download only." : null}
      </p>

      <div className="text-center">
        <Link href="/" className="text-primary font-semibold">
          ← Back to home
        </Link>
      </div>
    </section>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={<section className="py-16 text-center text-text-muted">Loading confirmation…</section>}
    >
      <SuccessInner />
    </Suspense>
  );
}
