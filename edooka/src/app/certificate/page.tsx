"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Page: Certificate
 * Purpose: Shows certificate-related quick actions for users.
 */
export default function CertificatePage() {
  const [coins, setCoins] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("edookaCoins") ?? 0);
  });

  function addReferralCoin() {
    const next = coins + 1;
    localStorage.setItem("edookaCoins", String(next));
    setCoins(next);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Certificate</h1>
      <p className="text-text-secondary">
        Download your certificate, verify it, share on social platforms, and track referral coins.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className="rounded-xl bg-primary px-4 py-2 font-semibold text-white card-hover">
          My certificates
        </Link>
        <Link href="/verify" className="rounded-xl border border-border-default px-4 py-2 card-hover">
          Verify sample
        </Link>
        <button
          type="button"
          onClick={addReferralCoin}
          className="rounded-xl border border-primary px-4 py-2 font-semibold text-primary card-hover"
        >
          Refer a friend (+1 coin)
        </button>
      </div>
      <article className="rounded-2xl border border-primary/30 bg-soft-orange p-4">
        <p className="font-semibold">Referral wallet: {coins} coins</p>
        <p className="text-sm text-text-secondary">Collect 5 coins to redeem 1 certificate unlock on checkout page.</p>
      </article>
    </section>
  );
}
