"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getTierByKey } from "@/lib/pricing";
import { normalizeLearnerAttempt } from "@/lib/learner";
import {
  EDOOKA_ATTEMPT_KEY,
  persistLearnerProfile,
  readLearnerProfile,
  type ActiveAttempt,
} from "@/lib/session-keys";

/**
 * Page: Checkout
 * Purpose: Confirm bundle and open Cashfree hosted checkout (or demo success without keys).
 */
function CheckoutInner() {
  const params = useParams<{ attemptId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bundleKey = searchParams.get("bundle") ?? "single";

  const tier = useMemo(() => getTierByKey(bundleKey), [bundleKey]);

  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [coins, setCoins] = useState(0);
  const [message, setMessage] = useState("");
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);
  const [backHref, setBackHref] = useState(`/result/${params.attemptId}/pricing`);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(EDOOKA_ATTEMPT_KEY);
    let loaded: ActiveAttempt | null = null;
    if (raw) {
      try {
        const data = normalizeLearnerAttempt(JSON.parse(raw) as ActiveAttempt);
        if (data.attemptId === params.attemptId) loaded = data;
      } catch {
        /* ignore */
      }
    }
    if (!loaded) {
      const fromDisk = readLearnerProfile(params.attemptId);
      if (fromDisk) loaded = normalizeLearnerAttempt(fromDisk);
    }
    if (loaded) {
      persistLearnerProfile(loaded);
      setAttempt(loaded);
    }
    const saved = sessionStorage.getItem("edooka_last_result_path");
    if (saved?.includes(params.attemptId)) {
      const pricingPath = saved.replace(`/result/${params.attemptId}`, `/result/${params.attemptId}/pricing`);
      setBackHref(pricingPath);
    }
  }, [params.attemptId]);

  useEffect(() => {
    const referralCode = attempt?.referredBy?.trim();
    if (!referralCode) {
      setCoins(0);
      return;
    }
    fetch(`/api/referral/coins?referralCode=${encodeURIComponent(referralCode)}`)
      .then((r) => r.json())
      .then((data: { coins?: number }) => {
        if (typeof data.coins === "number") setCoins(data.coins);
      })
      .catch(() => {});
  }, [attempt?.referredBy]);

  const redeemWithCoins = useCallback(() => {
    if (!attempt?.referredBy) {
      setMessage("No referral wallet linked to this attempt.");
      return;
    }
    if (coins < 5) {
      setMessage("You need at least 5 coins to redeem 1 certificate.");
      return;
    }
    setPayError("");
    setMessage("");
    setPaying(true);
    void fetch("/api/referral/spend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referralCode: attempt.referredBy,
        attemptId: params.attemptId,
        coins: 5,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean; coins?: number; reason?: string; error?: string };
        if (!res.ok || !data.ok) {
          if (data.reason === "already_spent_for_attempt") {
            setMessage("Coins already used for this attempt.");
          } else if (data.reason === "insufficient_coins") {
            setMessage("Not enough referral coins.");
          } else {
            setMessage(data.error ?? "Could not redeem referral coins.");
          }
          return;
        }
        if (typeof data.coins === "number") setCoins(data.coins);
        setMessage("Redeemed successfully! Certificate unlocked using referral coins.");
        const oid = `coins_${params.attemptId}`;
        router.push(
          `/success/${oid}?attemptId=${encodeURIComponent(params.attemptId)}&bundle=${encodeURIComponent(bundleKey)}&slug=${encodeURIComponent(attempt?.slug ?? "")}&demo=1`
        );
      })
      .catch(() => setMessage("Network error while redeeming coins."))
      .finally(() => setPaying(false));
  }, [attempt?.referredBy, bundleKey, coins, params.attemptId, router]);

  async function payNow() {
    if (!tier || !attempt) {
      setPayError("Missing bundle or session. Go back and start again.");
      return;
    }
    setPayError("");
    setPaying(true);
    try {
      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleKey: tier.key,
          attemptId: attempt.attemptId,
          programSlug: attempt.slug,
          customer: {
            name: attempt.name,
            email: attempt.email,
            phone: attempt.phone,
          },
        }),
      });
      const data = (await res.json()) as {
        paymentLink?: string;
        error?: string;
        hint?: string;
        demo?: boolean;
        message?: string;
        details?: unknown;
      };
      if (!res.ok) {
        const errText =
          typeof data.error === "string"
            ? data.error
            : typeof data.details === "object" && data.details !== null && "message" in data.details
              ? String((data.details as { message?: string }).message)
              : "";
        const parts = [errText, data.hint].filter(Boolean);
        setPayError(parts.join(" — ") || "Payment could not start.");
        return;
      }
      if (data.demo && data.message) {
        setMessage(data.message);
      }
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
        return;
      }
      setPayError("No payment URL returned.");
    } catch {
      setPayError("Network error starting checkout.");
    } finally {
      setPaying(false);
    }
  }

  if (!tier) {
    return (
      <section className="quiz-shell space-y-4">
        <h1 className="text-2xl font-bold">Invalid package</h1>
        <Link href="/#assessments" className="text-primary font-semibold">
          ← Assessments
        </Link>
      </section>
    );
  }

  return (
    <section className="quiz-shell space-y-8 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Checkout</p>
        <h1 className="mt-1 text-3xl font-extrabold">{tier.tier}</h1>
        <p className="mt-2 text-text-secondary">
          Attempt <span className="font-mono text-sm break-all">{params.attemptId}</span>
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Includes {tier.certificateCount} certificate{tier.certificateCount > 1 ? "s" : ""} to download
        </p>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border-default bg-white p-6 shadow-[0_10px_24px_rgba(255,149,88,0.2)] space-y-4"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-full text-center">
            <p className="text-sm text-text-muted">Amount due</p>
            <p className="text-4xl font-extrabold text-primary">₹{tier.priceInr}</p>
            <p className="text-sm text-text-secondary mt-1">{tier.note}</p>
          </div>
          {attempt ? (
            <div className="text-sm text-center text-text-secondary">
              <p>
                <strong>{attempt.name}</strong>
              </p>
              <p>{attempt.email}</p>
              <p>{attempt.phone}</p>
            </div>
          ) : (
            <p className="text-sm text-amber-700 font-semibold text-center">
              Session expired —{" "}
              <Link href="/#assessments" className="underline">
                restart from assessments
              </Link>
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!attempt || paying}
          onClick={() => void payNow()}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white shadow hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {paying ? "Starting checkout…" : "Continue to certificate checkout"}
        </button>
        {payError ? <p className="text-sm text-red-600">{payError}</p> : null}

        <p className="text-xs text-text-muted text-center">
          Secure payment via Cashfree · UPI · Cards · Net Banking · Wallets · 7-day refund if certificate is not
          delivered.
        </p>
      </motion.article>

      <article className="rounded-2xl border border-primary/30 bg-soft-orange p-5 space-y-3 text-center">
        <h3 className="text-xl font-bold">Referral coins</h3>
        <p className="text-text-secondary">
          Current coins: <strong>{coins}</strong> (5 coins = 1 certificate unlock)
        </p>
        <button
          type="button"
          disabled={paying}
          onClick={redeemWithCoins}
          className="rounded-xl border border-primary px-4 py-2 font-semibold text-primary card-hover disabled:opacity-50"
        >
          {paying ? "Redeeming…" : "Redeem 5 coins (skip payment)"}
        </button>
        {message ? <p className="text-sm">{message}</p> : null}
      </article>

      <div className="flex justify-center">
        <Link href={backHref} className="text-sm text-primary font-semibold">
          ← Back to results
        </Link>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<section className="py-16 text-center text-text-muted">Loading checkout…</section>}
    >
      <CheckoutInner />
    </Suspense>
  );
}
