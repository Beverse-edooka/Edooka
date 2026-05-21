"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CertificateShareButtons } from "@/components/certificate/ShareButtons";
import { verifyUrlForCertificate } from "@/lib/app-url";
import { certificateNumberForAttempt } from "@/lib/certificate";
import {
  addCreditsFromPurchase,
  getRemainingCredits,
  getIssuedForAttempt,
  redeemCertificateCredit,
} from "@/lib/certificate-wallet";
import { downloadCertificatePng } from "@/lib/download-certificate";
import { getCertificateCountForBundle } from "@/lib/pricing";
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
  const [remainingCredits, setRemainingCredits] = useState(0);
  const [certNumber, setCertNumber] = useState("");
  const [issuedVerifyUrl, setIssuedVerifyUrl] = useState("");
  const [fulfillmentDone, setFulfillmentDone] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

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

  const recipientName = attempt?.name ?? "Learner";
  const programTitle = attempt?.programTitle ?? "Healthcare assessment";
  const verifyUrl = useMemo(
    () => issuedVerifyUrl || (certNumber ? verifyUrlForCertificate(certNumber) : ""),
    [certNumber, issuedVerifyUrl]
  );

  // On payment success: add bundle credits, consume one for this attempt, persist + email (once).
  useEffect(() => {
    if (typeof window === "undefined" || !attempt || fulfillmentDone) return;
    const attemptId = attemptIdParam || attempt.attemptId;
    if (!attemptId || !attempt.slug) return;

    const flagKey = `edooka_fulfilled_${params.purchaseId}`;
    if (sessionStorage.getItem(flagKey)) {
      const issued = getIssuedForAttempt(attemptId);
      const existing = issued?.certificateNumber ?? certificateNumberForAttempt(attemptId);
      setTimeout(() => {
        setCertNumber(existing);
        setRemainingCredits(getRemainingCredits());
        setFulfillmentDone(true);
      }, 0);
      return;
    }

    addCreditsFromPurchase(params.purchaseId, certificateCredits);
    const redeem = redeemCertificateCredit({
      attemptId,
      slug: attempt.slug,
      programTitle,
      purchaseId: params.purchaseId,
    });

    const number = redeem.ok
      ? redeem.certificate.certificateNumber
      : certificateNumberForAttempt(attemptId);

    setTimeout(() => {
      setCertNumber(number);
      setRemainingCredits(getRemainingCredits());
      setFulfillmentDone(true);
    }, 0);

    sessionStorage.setItem(flagKey, "1");
    // Referral rule: award only after payment completion, server-side and idempotent.
    if (attempt.referredBy && attempt.email) {
      void fetch("/api/referral/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode: attempt.referredBy,
          referredEmail: attempt.email,
          trigger: "payment",
          purchaseId: params.purchaseId,
          certificateNumber: number,
        }),
      }).catch(() => {});
    }

    setIssueError(null);
    void (async () => {
      try {
        const issueRes = await fetch("/api/certificate/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            orderId: params.purchaseId,
            bundleKey,
            slug: attempt.slug,
            certificateNumber: number,
            name: attempt.name,
            email: attempt.email,
            phone: attempt.phone,
            programTitle,
            score: attempt.examScore,
            total: attempt.examTotal,
            passed: attempt.examPassed,
          }),
        });

        if (!issueRes.ok) {
          let detail = "";
          try {
            const data = (await issueRes.json()) as { error?: string };
            detail = data.error ?? "";
          } catch {
            /* ignore non-JSON */
          }
          setIssueError(
            detail
              ? `Could not register certificate — ${detail}. Verification may fail until you retry.`
              : "Could not register certificate — verification may fail until you retry.",
          );
          sessionStorage.removeItem(flagKey);
          return;
        }

        const issueData = (await issueRes.json()) as { verifyUrl?: string };
        if (issueData.verifyUrl) setIssuedVerifyUrl(issueData.verifyUrl);

        if (!attempt.email) return;

        const emailKey = `edooka_cert_email_${params.purchaseId}`;
        if (sessionStorage.getItem(emailKey)) {
          setEmailStatus("sent");
          return;
        }

        setEmailStatus("sending");
        const emailRes = await fetch("/api/certificate/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: attempt.email,
            certificateNumber: number,
          }),
        });
        const data = (await emailRes.json()) as { skipped?: boolean };
        if (data.skipped) setEmailStatus("skipped");
        else if (emailRes.ok) {
          setEmailStatus("sent");
          sessionStorage.setItem(emailKey, "1");
        } else setEmailStatus("error");
      } catch {
        setIssueError(
          "Could not register certificate — check your connection and refresh to retry.",
        );
        sessionStorage.removeItem(flagKey);
        setEmailStatus("error");
      }
    })();
  }, [
    attempt,
    attemptIdParam,
    bundleKey,
    certificateCredits,
    fulfillmentDone,
    params.purchaseId,
    programTitle,
  ]);

  useEffect(() => {
    setTimeout(() => {
      setIssuedDateLabel(
        new Date().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }, 0);
  }, []);

  const downloadCert = useCallback(async () => {
    if (!certNumber) return;
    await downloadCertificatePng({ certificateNumber: certNumber });
  }, [certNumber]);

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 rounded-2xl border border-border-default bg-white p-6 text-center shadow-[0_14px_36px_rgba(255,149,88,0.22)] sm:p-8"
      >
        <p className="text-4xl">🏆</p>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Payment confirmed</h1>
        <p className="text-sm text-text-secondary sm:text-base">
          {demo ? "Demo mode — no payment processed. " : null}
          Your certificate has been issued. A copy is emailed when Gmail is configured.
        </p>
        <p className="font-mono text-xs text-text-muted sm:text-sm">Order ref · {params.purchaseId}</p>
        {certificateCredits > 1 ? (
          <p className="text-sm font-semibold text-primary">
            {remainingCredits} certificate credit{remainingCredits !== 1 ? "s" : ""} left for future exams.
          </p>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4 rounded-2xl border-2 border-primary/25 bg-soft-orange p-6 text-center sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Certificate of achievement</p>
        <p className="text-sm text-text-muted">Presented to</p>
        <p className="text-2xl font-extrabold text-foreground sm:text-3xl">{recipientName}</p>
        <p className="text-sm text-text-secondary">
          for completing <strong>{programTitle}</strong>
        </p>
        <p className="pt-2 text-xs text-text-muted">
          {certNumber || "…"} · {issuedDateLabel}
        </p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          disabled={!certNumber || !!issueError}
          onClick={() => void downloadCert()}
          className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white shadow disabled:opacity-50 sm:px-6 sm:py-3"
          title={issueError ? "Register certificate first (refresh after fixing the error above)" : undefined}
        >
          Download certificate
        </motion.button>
        {verifyUrl ? (
          <CertificateShareButtons verifyUrl={verifyUrl} programTitle={programTitle} />
        ) : null}
      </div>

      <p className="text-center text-sm text-text-muted">
        Email:{" "}
        {emailStatus === "sending" && "Sending…"}
        {emailStatus === "sent" && "✓ Sent to your inbox"}
        {emailStatus === "skipped" && "Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local."}
        {emailStatus === "error" && "Could not send — download your certificate above."}
        {emailStatus === "idle" && attempt?.email ? "Preparing…" : !attempt?.email ? "Add email on start screen next time." : null}
      </p>

      {issueError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {issueError}
        </div>
      ) : null}

      <div className="text-center">
        <Link href="/" className="font-semibold text-primary">
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
