"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CertificateShareButtons } from "@/components/certificate/ShareButtons";
import { getProgramBySlug } from "@/data/programs";
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
import { persistCertificateIssue } from "@/lib/persist-certificate-issue";
import {
  EDOOKA_ATTEMPT_KEY,
  persistLearnerProfile,
  readLearnerProfile,
  type ActiveAttempt,
} from "@/lib/session-keys";

function firstNonEmpty(...values: (string | undefined | null)[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function SuccessInner() {
  const params = useParams<{ purchaseId: string }>();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get("attemptId") ?? "";
  const slugParam = searchParams.get("slug") ?? "";
  const bundleKey = searchParams.get("bundle") ?? "single";
  const demo = searchParams.get("demo") === "1";
  const certificateCredits = getCertificateCountForBundle(bundleKey);

  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [holderName, setHolderName] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [programSlug, setProgramSlug] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "skipped" | "error">("idle");
  const [issuedDateLabel, setIssuedDateLabel] = useState("");
  const [remainingCredits, setRemainingCredits] = useState(0);
  const [certNumber, setCertNumber] = useState("");
  const [issuedVerifyUrl, setIssuedVerifyUrl] = useState("");
  const [fulfillmentDone, setFulfillmentDone] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [paymentGate, setPaymentGate] = useState<"loading" | "paid" | "failed" | "unavailable">("loading");
  const [paymentDetail, setPaymentDetail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const hydrateFromLocal = (): ActiveAttempt | null => {
      let loaded: ActiveAttempt | null = null;
      const raw = sessionStorage.getItem(EDOOKA_ATTEMPT_KEY);
      if (raw) {
        try {
          const data = normalizeLearnerAttempt(JSON.parse(raw) as ActiveAttempt);
          if (!attemptIdParam || data.attemptId === attemptIdParam) loaded = data;
        } catch {
          /* ignore */
        }
      }
      if (!loaded && attemptIdParam) {
        const fromDisk = readLearnerProfile(attemptIdParam);
        if (fromDisk) loaded = normalizeLearnerAttempt(fromDisk);
      }
      return loaded;
    };

    const applyLoaded = (loaded: ActiveAttempt) => {
      if (cancelled) return;
      persistLearnerProfile(loaded);
      setAttempt(loaded);
      setProgramSlug(loaded.slug);
      if (loaded.name.trim()) setHolderName(loaded.name.trim());
      if (loaded.programTitle.trim()) setCourseTitle(loaded.programTitle.trim());
    };

    void (async () => {
      const local = hydrateFromLocal();
      const hasGoodName = !!local?.name.trim() && local.name.trim().toLowerCase() !== "learner";

      if (local && hasGoodName) {
        applyLoaded(local);
        if (!cancelled) setProfileReady(true);
        return;
      }

      // Local data missing or incomplete (common on mobile after Cashfree redirect).
      // Fetch the canonical profile from the server using attemptId.
      if (attemptIdParam) {
        try {
          const res = await fetch(`/api/attempt-profile/${encodeURIComponent(attemptIdParam)}`);
          if (res.ok) {
            const data = (await res.json()) as {
              ok?: boolean;
              holderName?: string;
              email?: string;
              phone?: string;
              programSlug?: string;
              programTitle?: string;
              programCategory?: string;
            };
            if (data.ok && data.holderName?.trim()) {
              const merged: ActiveAttempt = {
                attemptId: attemptIdParam,
                slug: data.programSlug || local?.slug || slugParam || "",
                programTitle: data.programTitle || local?.programTitle || "",
                programCategory: data.programCategory || local?.programCategory || "",
                name: data.holderName.trim(),
                email: data.email || local?.email || "",
                phone: data.phone || local?.phone || "",
                startedAt: local?.startedAt ?? Date.now(),
                referredBy: local?.referredBy,
              };
              applyLoaded(merged);
              if (!cancelled) setProfileReady(true);
              return;
            }
          }
        } catch {
          /* fall through to local fallback */
        }
      }

      // Final fallback — at least populate the program from catalog.
      if (local) {
        applyLoaded(local);
      } else if (slugParam) {
        const catalog = getProgramBySlug(slugParam);
        if (catalog && !cancelled) {
          setProgramSlug(slugParam);
          setCourseTitle(catalog.title);
        }
      }
      if (!cancelled) setProfileReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptIdParam, slugParam]);

  const recipientName = firstNonEmpty(holderName, attempt?.name) || (profileReady ? "Learner" : "…");
  const programTitle =
    firstNonEmpty(courseTitle, attempt?.programTitle) ||
    (profileReady && programSlug ? getProgramBySlug(programSlug)?.title : "") ||
    (profileReady ? "Healthcare assessment" : "…");
  const shareSlug = programSlug || attempt?.slug || slugParam;

  const verifyUrl = useMemo(
    () => issuedVerifyUrl || (certNumber ? verifyUrlForCertificate(certNumber) : ""),
    [certNumber, issuedVerifyUrl]
  );

  const paymentVerified = paymentGate === "paid";

  useEffect(() => {
    let cancelled = false;
    const flagKey = `edooka_fulfilled_${params.purchaseId}`;

    setPaymentGate("loading");
    setPaymentDetail("");

    const verifyUrl = `/api/cashfree/order-status?orderId=${encodeURIComponent(params.purchaseId)}&demo=${demo ? "1" : "0"}`;

    void (async () => {
      let lastData: {
        paid?: boolean;
        orderStatus?: string;
        message?: string;
        source?: string;
      } = {};

      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (cancelled) return;
        try {
          const res = await fetch(verifyUrl);
          lastData = (await res.json()) as typeof lastData;
          if (lastData.paid) {
            setPaymentGate("paid");
            return;
          }
          const retryable =
            lastData.orderStatus === "ACTIVE" ||
            lastData.orderStatus === "PENDING" ||
            lastData.source === "unavailable";
          if (!retryable || attempt === 5) break;
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
        } catch {
          if (attempt === 5) {
            sessionStorage.removeItem(flagKey);
            setPaymentDetail("Could not verify payment status. Please try again.");
            setPaymentGate("unavailable");
            return;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
        }
      }

      if (cancelled) return;
      sessionStorage.removeItem(flagKey);
      const status = lastData.orderStatus?.trim();
      setPaymentDetail(
        lastData.message?.trim() ||
          (status ? `Payment status: ${status}` : "Payment was cancelled or not completed.")
      );
      setPaymentGate(lastData.source === "unavailable" ? "unavailable" : "failed");
    })();

    return () => {
      cancelled = true;
    };
  }, [demo, params.purchaseId]);

  useEffect(() => {
    if (!certNumber) return;
    let cancelled = false;
    void fetch(`/api/verify/${encodeURIComponent(certNumber)}`)
      .then((res) => res.json())
      .then((data: { valid?: boolean; holderName?: string; programTitle?: string; programSlug?: string }) => {
        if (cancelled || !data.valid) return;
        if (data.holderName?.trim()) setHolderName(data.holderName.trim());
        if (data.programTitle?.trim()) setCourseTitle(data.programTitle.trim());
        if (data.programSlug?.trim()) setProgramSlug(data.programSlug.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [certNumber]);

  useEffect(() => {
    if (typeof window === "undefined" || !attempt || fulfillmentDone || !paymentVerified) return;
    const attemptId = attemptIdParam || attempt.attemptId;
    if (!attemptId || !attempt.slug) return;

    const flagKey = `edooka_fulfilled_${params.purchaseId}`;
    const alreadyFulfilled = sessionStorage.getItem(flagKey);

    let number: string;
    if (alreadyFulfilled) {
      const issued = getIssuedForAttempt(attemptId);
      number = issued?.certificateNumber ?? certificateNumberForAttempt(attemptId);
    } else {
      addCreditsFromPurchase(params.purchaseId, certificateCredits);
      const titleForWallet = firstNonEmpty(courseTitle, attempt.programTitle) || programTitle;
      const redeem = redeemCertificateCredit({
        attemptId,
        slug: attempt.slug,
        programTitle: titleForWallet,
        purchaseId: params.purchaseId,
      });
      number = redeem.ok
        ? redeem.certificate.certificateNumber
        : certificateNumberForAttempt(attemptId);
      sessionStorage.setItem(flagKey, "1");

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
    }

    setTimeout(() => {
      setCertNumber(number);
      setRemainingCredits(getRemainingCredits());
      setFulfillmentDone(true);
    }, 0);

    setIssueError(null);
    void (async () => {
      const persisted = await persistCertificateIssue({
        attempt,
        certificateNumber: number,
        orderId: params.purchaseId,
        bundleKey,
      });

      if (!persisted.ok) {
        setIssueError(
          `Could not register certificate — ${persisted.error}. Download will retry registration when you click the button.`,
        );
        if (!alreadyFulfilled) sessionStorage.removeItem(flagKey);
        return;
      }

      if (persisted.verifyUrl) setIssuedVerifyUrl(persisted.verifyUrl);
      if (persisted.holderName?.trim()) setHolderName(persisted.holderName.trim());
      if (persisted.programTitle?.trim()) setCourseTitle(persisted.programTitle.trim());
      if (persisted.programSlug?.trim()) setProgramSlug(persisted.programSlug.trim());

      const merged: ActiveAttempt = {
        ...attempt,
        name: firstNonEmpty(persisted.holderName, attempt.name) || attempt.name,
        programTitle: firstNonEmpty(persisted.programTitle, attempt.programTitle) || attempt.programTitle,
        slug: persisted.programSlug?.trim() || attempt.slug,
      };
      setAttempt(merged);
      persistLearnerProfile(merged);
      try {
        sessionStorage.setItem(EDOOKA_ATTEMPT_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }

      const email = attempt.email?.trim();
      if (!email || !email.includes("@")) return;

      const emailKey = `edooka_cert_email_${params.purchaseId}`;
      if (sessionStorage.getItem(emailKey)) {
        setEmailStatus("sent");
        return;
      }

      setEmailStatus("sending");
      try {
        const emailRes = await fetch("/api/certificate/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, certificateNumber: number }),
        });
        const data = (await emailRes.json()) as { skipped?: boolean };
        if (data.skipped) setEmailStatus("skipped");
        else if (emailRes.ok) {
          setEmailStatus("sent");
          sessionStorage.setItem(emailKey, "1");
        } else setEmailStatus("error");
      } catch {
        setEmailStatus("error");
      }
    })();
  }, [
    attempt,
    attemptIdParam,
    bundleKey,
    certificateCredits,
    courseTitle,
    fulfillmentDone,
    params.purchaseId,
    paymentVerified,
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
    if (!certNumber || !attempt) return;
    await downloadCertificatePng({
      certificateNumber: certNumber,
      register: {
        attempt,
        orderId: params.purchaseId,
        bundleKey,
      },
      fallback: {
        fullName: recipientName,
        courseName: programTitle,
        certificateNumber: certNumber,
        verifyUrl: verifyUrl || verifyUrlForCertificate(certNumber),
      },
    });
  }, [attempt, bundleKey, certNumber, params.purchaseId, recipientName, programTitle, verifyUrl]);

  const checkoutRetryHref =
    attemptIdParam && (attempt?.slug || slugParam)
      ? `/checkout/${encodeURIComponent(attemptIdParam)}?bundle=${encodeURIComponent(bundleKey)}`
      : attemptIdParam
        ? `/checkout/${encodeURIComponent(attemptIdParam)}?bundle=${encodeURIComponent(bundleKey)}`
        : "/#assessments";

  if (paymentGate === "loading") {
    return (
      <section className="quiz-shell py-16 text-center text-text-muted">
        Verifying payment status…
      </section>
    );
  }

  if (paymentGate === "failed" || paymentGate === "unavailable") {
    return (
      <section className="quiz-shell space-y-6 sm:space-y-8">
        <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm sm:p-8">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-2xl font-extrabold text-red-800 sm:text-3xl">Payment not completed</h1>
          <p className="text-sm text-red-700 sm:text-base">
            {paymentGate === "unavailable"
              ? "We could not confirm your payment right now."
              : "Your payment was cancelled or failed."}{" "}
            No certificate has been issued for this order.
          </p>
          {paymentDetail ? <p className="text-xs text-red-600 sm:text-sm">{paymentDetail}</p> : null}
          <p className="font-mono text-xs text-red-500/90 sm:text-sm">Order ref · {params.purchaseId}</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Link
            href={checkoutRetryHref}
            className="w-full max-w-sm rounded-xl bg-primary px-5 py-2.5 text-center font-semibold text-white shadow hover:bg-primary-hover sm:px-6 sm:py-3"
          >
            Try payment again
          </Link>
          <Link href="/" className="text-sm font-semibold text-primary">
            ← Back to home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-shell space-y-6 sm:space-y-8">
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

      <div className="flex flex-col items-center gap-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          disabled={!certNumber || !!issueError}
          onClick={() => void downloadCert()}
          className="w-full max-w-sm rounded-xl bg-primary px-5 py-2.5 font-semibold text-white shadow disabled:opacity-50 sm:px-6 sm:py-3"
          title={issueError ? "Register certificate first (refresh after fixing the error above)" : undefined}
        >
          Download certificate
        </motion.button>
        {verifyUrl && shareSlug ? (
          <CertificateShareButtons
            courseName={programTitle}
            programSlug={shareSlug}
            verifyUrl={verifyUrl}
            certificateNumber={certNumber || undefined}
            holderName={recipientName}
          />
        ) : null}
      </div>

      <p className="text-center text-sm text-text-muted">
        Email:{" "}
        {emailStatus === "sending" && "Sending…"}
        {emailStatus === "sent" && "✓ Sent to your inbox"}
        {emailStatus === "skipped" &&
          "Certificate email was not sent — add GMAIL_USER and GMAIL_APP_PASSWORD in Railway or Vercel environment variables (Gmail App Password)."}
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
