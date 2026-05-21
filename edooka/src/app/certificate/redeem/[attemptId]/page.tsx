"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CertificateShareButtons } from "@/components/certificate/ShareButtons";
import { verifyUrlForCertificate } from "@/lib/app-url";
import {
  getIssuedForAttempt,
  getRemainingCredits,
  isAttemptRedeemed,
  redeemCertificateCredit,
} from "@/lib/certificate-wallet";
import { downloadCertificatePng } from "@/lib/download-certificate";
import { normalizeLearnerAttempt } from "@/lib/learner";
import { EDOOKA_ATTEMPT_KEY, readLearnerProfile, type ActiveAttempt } from "@/lib/session-keys";

/**
 * Page: Redeem wallet credit — uses one bundle credit on entry; download does not consume again.
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
    setIssuedDateLabel(
      new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    );

    const existing = getIssuedForAttempt(attemptId);
    if (existing) {
      setCertNumber(existing.certificateNumber);
      setCredits(getRemainingCredits());
      return;
    }

    if (!loaded) {
      setError("Session not found. Complete the assessment again.");
      return;
    }

    const result = redeemCertificateCredit({
      attemptId,
      slug: loaded.slug,
      programTitle: loaded.programTitle || "Healthcare assessment",
    });

    if (!result.ok) {
      setError(
        result.reason === "no_credits"
          ? "No certificate credits left. Purchase a package to download."
          : "Could not issue certificate."
      );
      return;
    }

    const issuedNumber = result.certificate.certificateNumber;
    setCertNumber(issuedNumber);
    setCredits(getRemainingCredits());

    // Persist into Postgres so the verify endpoint can resolve this cert.
    // The redeem flow doesn't have a Cashfree order, so we synthesise one
    // from the attempt id; the issue route upserts a purchase row off it.
    void fetch("/api/certificate/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        orderId: `wallet-${attemptId}`,
        bundleKey: "single",
        slug: loaded.slug,
        certificateNumber: issuedNumber,
        name: loaded.name,
        email: loaded.email,
        phone: loaded.phone,
        programTitle: loaded.programTitle,
        score: loaded.examScore,
        total: loaded.examTotal,
        passed: loaded.examPassed,
      }),
    }).catch(() => {
      /* network errors surface via verify-not-found later */
    });
  }, [attemptId]);

  const programTitle = attempt?.programTitle ?? "Healthcare assessment";
  const recipientName = attempt?.name ?? "Learner";
  const verifyUrl = useMemo(
    () => (certNumber ? verifyUrlForCertificate(certNumber) : ""),
    [certNumber]
  );

  const downloadCert = useCallback(async () => {
    if (!certNumber) return;
    await downloadCertificatePng({
      fullName: recipientName,
      courseName: programTitle,
      certificateNumber: certNumber,
      verifyUrl,
    });
    // Server-side referral award on certificate download path (idempotent).
    if (attempt?.referredBy && attempt.email) {
      void fetch("/api/referral/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode: attempt.referredBy,
          referredEmail: attempt.email,
          trigger: "certificate_download",
          certificateNumber: certNumber,
        }),
      }).catch(() => {});
    }
  }, [attempt?.email, attempt?.referredBy, certNumber, recipientName, programTitle, verifyUrl]);

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
    <section className="mx-auto w-full max-w-2xl space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 rounded-2xl border border-border-default bg-white p-6 text-center shadow-sm sm:p-8"
      >
        <p className="text-4xl">🏆</p>
        <h1 className="text-2xl font-extrabold">Certificate unlocked</h1>
        <p className="text-sm text-text-secondary">
          {isAttemptRedeemed(attemptId)
            ? "Your certificate is ready."
            : "One credit was used from your bundle."}
        </p>
        <p className="text-sm font-semibold text-primary">
          {credits} credit{credits !== 1 ? "s" : ""} remaining for future exams
        </p>
        <p className="font-mono text-xs text-text-muted">{certNumber}</p>
      </motion.div>

      <div className="flex flex-col items-center gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => void downloadCert()}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow"
        >
          Download certificate
        </motion.button>
        <CertificateShareButtons verifyUrl={verifyUrl} programTitle={programTitle} />
        <Link
          href={`/verify/${encodeURIComponent(certNumber)}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Verify certificate online
        </Link>
      </div>

      <p className="text-center">
        <Link href="/assessments" className="font-semibold text-primary">
          ← Back to assessments
        </Link>
      </p>
    </section>
  );
}
