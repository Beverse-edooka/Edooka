"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getRemainingCredits } from "@/lib/certificate-wallet";
import { PRICING_TIERS } from "@/lib/pricing";
import { COMPANY_NAME } from "@/lib/site";

type Props = {
  attemptId: string;
  backHref?: string;
  backLabel?: string;
};

/**
 * Certificate package grid (post-qualification pricing).
 */
export function PricingTiers({ attemptId, backHref, backLabel = "← Back to results" }: Props) {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCredits(getRemainingCredits());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      {credits !== null && credits > 0 ? (
        <div className="rounded-xl border border-primary/30 bg-soft-orange px-5 py-4 text-center space-y-2">
          <p className="text-sm font-semibold text-primary">
            You have {credits} prepaid certificate credit{credits > 1 ? "s" : ""} — no payment needed
          </p>
          <Link
            href={`/certificate/redeem/${attemptId}`}
            className="inline-flex rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Download with credit (free)
          </Link>
        </div>
      ) : null}

      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Choose a package</p>
        <h1 className="text-2xl font-extrabold">Same pricing · unlock your credential</h1>
        <p className="text-sm text-text-muted">Demo checkout by default — no payment gateway required.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
        {PRICING_TIERS.map((plan) => (
          <motion.article
            key={plan.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4, boxShadow: "0 16px 32px rgba(255,107,53,0.18)" }}
            className={`relative flex h-full min-h-[280px] flex-col rounded-2xl bg-white p-5 pt-7 text-center shadow-sm border ${
              plan.popular ? "border-2 border-primary" : "border-border-default"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 z-[1] -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
                MOST POPULAR
              </span>
            )}
            <div className="flex min-h-0 flex-1 flex-col">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">{plan.tier}</p>
              <p className="mt-2 text-4xl font-extrabold text-foreground">{plan.priceDisplay}</p>
              {plan.sub ? (
                <p className="mt-1 min-h-[1.25rem] text-sm text-text-muted">{plan.sub}</p>
              ) : (
                <div className="mt-1 min-h-[1.25rem]" aria-hidden />
              )}
              {plan.save ? (
                <span className="mt-2 inline-block rounded-full bg-soft-orange px-3 py-0.5 text-xs font-bold text-primary">
                  {plan.save}
                </span>
              ) : (
                <div className="mt-2 flex min-h-[1.75rem] items-center justify-center" aria-hidden />
              )}
              <p className="mt-2 flex-1 text-xs leading-relaxed text-text-secondary">{plan.note}</p>
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-4 shrink-0">
              <Link
                href={`/checkout/${attemptId}?bundle=${plan.key}`}
                className="block w-full rounded-lg border-2 border-foreground py-2.5 text-sm font-bold transition hover:bg-foreground hover:text-white"
              >
                {plan.cta}
              </Link>
            </motion.div>
          </motion.article>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border-default bg-soft-orange px-5 py-3 text-xs text-text-muted">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke="#ff6b35"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        Secure payment via Cashfree · UPI · Cards · Net Banking · Wallets. GST invoice from {COMPANY_NAME}.
      </div>

      {backHref ? (
        <div className="text-center">
          <Link href={backHref} className="text-sm font-semibold text-primary hover:underline">
            {backLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
