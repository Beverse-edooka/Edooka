"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { motion } from "framer-motion";
import { CertificateDocument } from "@/components/pdf/CertificateDocument";
import { verifyUrlForCertificate } from "@/lib/app-url";
import {
  getIssuedForAttempt,
  getRemainingCredits,
  isAttemptRedeemed,
  redeemCertificateCredit,
} from "@/lib/certificate-wallet";
import { getProgramBySlug } from "@/data/programs";
import { normalizeLearnerAttempt } from "@/lib/learner";
import { EDOOKA_ATTEMPT_KEY, readLearnerProfile, type ActiveAttempt } from "@/lib/session-keys";

/**
 * Page: Redeem wallet credit — free certificate download when bundle credits remain.
 */
export default function RedeemCertificatePage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId ?? "";

  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [credits, setCredits] = useState(0);
  const [certNumber, setCertNumber] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [issuedDateLabel, setIssuedDateLabel] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let loaded: ActiveAttempt | null = null;
    const raw = sessionStorage.getItem(EDOOKA_ATTEMPT_KEY);
    if (raw) {
      try {
        const data = normalizeLearnerAttempt(JSON.parse(raw) as ActiveAttempt);
        if (data.attemptId === attemptId) loaded = data;
      } catch {
        /* ignore */
      }
    }
    if (!loaded) {
      const fromDisk = readLearnerProfile(attemptId);
      if (fromDisk) loaded = normalizeLearnerAttempt(fromDisk);
    }
    setAttempt(loaded);
    setCredits(getRemainingCredits());
    setIssuedDateLabel(
      new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    );

    const existing = getIssuedForAttempt(attemptId);
    if (existing) {
      setCertNumber(existing.certificateNumber);
      return;
    }

    if (!loaded) {
      setError("Session not found. Complete the assessment again.");
      return;
    }

    const program = getProgramBySlug(loaded.slug);
    const result = redeemCertificateCredit({
      attemptId,
      slug: loaded.slug,
      programTitle: loaded.programTitle || program?.title || "Healthcare assessment",
    });

    if (!result.ok) {
      setError(
        result.reason === "no_credits"
          ? "No certificate credits left. Purchase a package to download."
          : "Could not issue certificate."
      );
      return;
    }

    setCertNumber(result.certificate.certificateNumber);
    setCredits(getRemainingCredits());
  }, [attemptId]);

  const programTitle = attempt?.programTitle ?? "Healthcare assessment";
  const recipientName = attempt?.name ?? "Learner";
  const verifyUrl = useMemo(
    () => (certNumber ? verifyUrlForCertificate(certNumber) : ""),
    [certNumber]
  );

  const downloadPdf = useCallback(async () => {
    if (!certNumber) return;
    const blob = await pdf(
      <CertificateDocument
        recipientName={recipientName}
        programTitle={programTitle}
        certificateNumber={certNumber}
        issuedDateLabel={issuedDateLabel}
        verifyUrl={verifyUrl}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edooka-certificate-${certNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [certNumber, recipientName, programTitle, issuedDateLabel, verifyUrl]);

  if (error) {
    return (
      <section className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-bold">Certificate unavailable</h1>
        <p className="text-text-secondary">{error}</p>
        <Link
          href={`/result/${attemptId}/pricing`}
          className="inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-white"
        >
          View pricing
        </Link>
      </section>
    );
  }

  if (!certNumber) {
    return <section className="py-16 text-center text-text-muted">Preparing your certificate…</section>;
  }

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border-default bg-white p-8 text-center space-y-3 shadow-sm"
      >
        <p className="text-4xl">🏆</p>
        <h1 className="text-2xl font-extrabold">Certificate unlocked</h1>
        <p className="text-sm text-text-secondary">
          {isAttemptRedeemed(attemptId)
            ? "You already issued a certificate for this attempt."
            : "One credit was used from your bundle."}
        </p>
        <p className="text-sm text-primary font-semibold">
          {credits} credit{credits !== 1 ? "s" : ""} remaining for future exams
        </p>
        <p className="text-xs font-mono text-text-muted">{certNumber}</p>
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
        <Link
          href={`/verify/${encodeURIComponent(certNumber)}`}
          className="rounded-xl border border-border-default px-6 py-3 font-semibold card-hover"
        >
          Verify certificate
        </Link>
      </div>

      <p className="text-center">
        <Link href="/assessments" className="text-primary font-semibold">
          ← Back to assessments
        </Link>
      </p>
    </section>
  );
}
