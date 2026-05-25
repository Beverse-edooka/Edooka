"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getProgramBySlug } from "@/data/programs";
import { normalizeLearnerAttempt } from "@/lib/learner";
import {
  ASSESSMENT_NUM_QUESTIONS,
  minCorrectToPass,
  PASS_QUALIFY_COPY,
} from "@/lib/assessment-constants";
import { COMPANY_NAME } from "@/lib/site";
import { CertificateShareButtons } from "@/components/certificate/ShareButtons";
import { verifyUrlForCertificate } from "@/lib/app-url";
import {
  getIssuedForAttempt,
  getRemainingCredits,
  isAttemptRedeemed,
} from "@/lib/certificate-wallet";
import { EDOOKA_ATTEMPT_KEY, persistLearnerProfile, readLearnerProfile, type ActiveAttempt } from "@/lib/session-keys";

const RETRY_HOURS = 24;
const STORAGE_KEY = "edookaLastAttempt";

function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((i) => {
        const x = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const dur = 1.8 + Math.random() * 1.2;
        const color = ["#ff6b35", "#ffd700", "#4ade80", "#60a5fa", "#f472b6"][i % 5];
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${x}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: "110vh", opacity: 0, rotate: 720 }}
            transition={{ duration: dur, delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              top: 0,
              width: 10,
              height: 10,
              borderRadius: 2,
              background: color,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Page: Result
 * Purpose: Pass/fail outcome, qualification messaging, and bundle selection toward checkout.
 */
export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const score = Number(searchParams.get("score") ?? 0);
  const total = Number(searchParams.get("total") ?? ASSESSMENT_NUM_QUESTIONS);
  const slug = searchParams.get("slug") ?? "";
  const passThresholdRaw = Number(searchParams.get("passThreshold") ?? 50);
  const passThreshold = Number.isFinite(passThresholdRaw)
    ? Math.min(100, Math.max(0, passThresholdRaw))
    : 50;

  const passed = total > 0 && score * 100 >= total * passThreshold;

  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [showConfetti, setShowConfetti] = useState(passed);
  const [retryInfo, setRetryInfo] = useState<{ canRetry: boolean; hoursLeft: number }>({
    canRetry: true,
    hoursLeft: 0,
  });
  const [walletCredits, setWalletCredits] = useState(0);
  const [alreadyIssued, setAlreadyIssued] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("edooka_last_result_path", `${pathname}?${searchParams.toString()}`);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let next: ActiveAttempt | null = null;
    const raw = sessionStorage.getItem(EDOOKA_ATTEMPT_KEY);
    if (raw) {
      try {
        const data = normalizeLearnerAttempt(JSON.parse(raw) as ActiveAttempt);
        if (data.attemptId === params.attemptId) next = data;
      } catch {
        /* ignore */
      }
    }
    if (!next) {
      const fromDisk = readLearnerProfile(params.attemptId);
      if (fromDisk) next = normalizeLearnerAttempt(fromDisk);
    }
    if (next) {
      setAttempt(next);
      persistLearnerProfile(next);
    }
  }, [params.attemptId]);

  useEffect(() => {
    if (!passed) return;
    const raw = sessionStorage.getItem(EDOOKA_ATTEMPT_KEY);
    if (!raw) return;
    try {
      const data = normalizeLearnerAttempt(JSON.parse(raw) as ActiveAttempt);
      if (data.attemptId !== params.attemptId) return;
      const merged: ActiveAttempt = {
        ...data,
        examPassed: true,
        examScore: score,
        examTotal: total,
        examCompletedAt: Date.now(),
      };
      sessionStorage.setItem(EDOOKA_ATTEMPT_KEY, JSON.stringify(merged));
      persistLearnerProfile(merged);
      setAttempt(merged);
    } catch {
      /* ignore */
    }
  }, [passed, params.attemptId, score, total]);

  const program = useMemo(() => (slug ? getProgramBySlug(slug) : undefined), [slug]);

  const courseTitle = program?.title ?? attempt?.programTitle ?? "your program";

  useEffect(() => {
    if (!passed) return;
    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, [passed]);

  useEffect(() => {
    if (passed) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setRetryInfo({ canRetry: false, hoursLeft: RETRY_HOURS });
      return;
    }
    const ts = Number(raw);
    const elapsed = (Date.now() - ts) / 36e5;
    if (elapsed >= RETRY_HOURS) {
      localStorage.removeItem(STORAGE_KEY);
      setRetryInfo({ canRetry: true, hoursLeft: 0 });
    } else {
      setRetryInfo({ canRetry: false, hoursLeft: Math.ceil(RETRY_HOURS - elapsed) });
    }
  }, [passed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setWalletCredits(getRemainingCredits());
    setAlreadyIssued(isAttemptRedeemed(params.attemptId));
  }, [params.attemptId]);

  const displayName = attempt?.name ?? "Your name";
  const resultQuery = searchParams.toString();
  const pricingHref = `/result/${params.attemptId}/pricing${resultQuery ? `?${resultQuery}` : ""}`;
  const redeemHref = `/certificate/redeem/${params.attemptId}`;
  const minCorrect = minCorrectToPass(total, passThreshold);
  const issuedCert = getIssuedForAttempt(params.attemptId);

  return (
    <>
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      <section className="quiz-shell space-y-8 rounded-2xl border border-border-default bg-white p-6 shadow-[0_12px_28px_rgba(255,149,88,0.24)] sm:p-8">
        {passed ? (
          <div className="space-y-8">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="rounded-2xl bg-gradient-to-r from-primary to-primary-light p-6 text-white text-center space-y-2"
            >
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-3xl"
              >
                🎉
              </motion.p>
              <p className="text-sm uppercase tracking-widest font-semibold opacity-80">Congratulations</p>
              <h1 className="text-3xl font-extrabold">You qualified!</h1>
              <p className="opacity-90">
                You scored <strong>{score}</strong> out of <strong>{total}</strong> in <strong>{courseTitle}</strong>.
                Tap below to acquire your verifiable certificate.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-soft-orange p-8 text-center"
            >
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl backdrop-blur-[2px] bg-white/35">
                <span className="text-4xl">🔒</span>
                <p className="mt-2 font-bold text-foreground">Certificate locked</p>
                <p className="text-sm text-text-muted mt-1">Pay once to unlock · PDF emailed automatically</p>
              </div>

              <div className="opacity-90">
                <p className="text-xs uppercase tracking-widest text-primary font-semibold">
                  Certificate of achievement
                </p>
                <p className="mt-3 text-sm text-text-muted">This is to certify that</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground blur-[3px] select-none">{displayName}</p>
                <p className="mt-3 text-sm text-text-secondary">
                  has successfully completed the assessment in{" "}
                  <span className="font-bold text-foreground">{courseTitle}</span>
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-center space-y-3"
            >
              {alreadyIssued && issuedCert ? (
                <>
                  <p className="text-sm text-text-secondary">
                    Certificate issued: <span className="font-mono font-semibold">{issuedCert.certificateNumber}</span>
                  </p>
                  <Link
                    href={redeemHref}
                    className="inline-flex rounded-xl bg-primary px-8 py-3 text-lg font-semibold text-white shadow hover:bg-primary-hover transition-colors"
                  >
                    Download certificate again
                  </Link>
                  <CertificateShareButtons
                    courseName={courseTitle}
                    programSlug={attempt?.slug ?? slug}
                    verifyUrl={verifyUrlForCertificate(issuedCert.certificateNumber)}
                    certificateNumber={issuedCert.certificateNumber}
                    className="pt-2"
                  />
                </>
              ) : walletCredits > 0 ? (
                <>
                  <p className="text-sm text-primary font-semibold">
                    You have {walletCredits} prepaid certificate credit{walletCredits > 1 ? "s" : ""} from your bundle
                  </p>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href={redeemHref}
                      className="inline-flex rounded-xl bg-primary px-8 py-3 text-lg font-semibold text-white shadow hover:bg-primary-hover transition-colors"
                    >
                      Download certificate (free)
                    </Link>
                  </motion.div>
                  <p className="text-xs text-text-muted">
                    Or{" "}
                    <Link href={pricingHref} className="font-semibold text-primary hover:underline">
                      buy another package
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href={pricingHref}
                      className="inline-flex rounded-xl bg-primary px-8 py-3 text-lg font-semibold text-white shadow hover:bg-primary-hover transition-colors"
                    >
                      Acquire Certificate
                    </Link>
                  </motion.div>
                  <p className="text-sm text-text-muted">
                    Choose a package on the next step to unlock your PDF certificate.
                  </p>
                </>
              )}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 text-center py-4"
          >
            <p className="text-5xl">😔</p>
            <h1 className="text-3xl font-extrabold">Almost there!</h1>
            <p className="text-lg text-text-secondary">
              You got <span className="font-bold text-primary">{score}</span> of{" "}
              <span className="font-bold">{total}</span> correct. {PASS_QUALIFY_COPY} You needed at least{" "}
              <strong>{minCorrect}</strong>
              {passThreshold !== 50 ? ` (${passThreshold}% pass bar)` : ""}.
            </p>

            {retryInfo.canRetry ? (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={slug ? `/start/${slug}` : "/#assessments"}
                  className="inline-flex rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary-hover transition-colors"
                >
                  Try again →
                </Link>
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-border-default bg-soft-orange p-5 space-y-2">
                <p className="text-2xl">⏳</p>
                <p className="font-bold text-foreground">
                  Reattempt available in {retryInfo.hoursLeft} hour{retryInfo.hoursLeft !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-text-muted">
                  To maintain assessment integrity, retakes are allowed only after 24 hours.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </section>
    </>
  );
}
