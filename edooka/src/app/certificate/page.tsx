"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Page: Certificate
 * Purpose: Shows certificate-related quick actions for users.
 */
export default function CertificatePage() {
  const [coins, setCoins] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const code = localStorage.getItem("edookaReferralCode");
    if (!code) return;
    fetch(`/api/referral/coins?referralCode=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d: { coins?: number }) => {
        if (typeof d.coins === "number") setCoins(d.coins);
      })
      .catch(() => {});
  }, []);

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
        <Link href="/assessments" className="rounded-xl border border-primary px-4 py-2 font-semibold text-primary card-hover">
          Take assessment
        </Link>
      </div>
      <article className="rounded-2xl border border-primary/30 bg-soft-orange p-4">
        <p className="font-semibold">Referral wallet: {coins} coins</p>
        <p className="text-sm text-text-secondary">Collect 5 coins to redeem 1 certificate unlock on checkout page.</p>
      </article>
    </section>
  );
}
