"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

/**
 * Page: Checkout
 * Purpose: Pricing plans and referral-coin redemption.
 */
export default function CheckoutPage() {
  const params = useParams<{ attemptId: string }>();
  const [coins, setCoins] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("edookaCoins") ?? 0);
  });
  const [message, setMessage] = useState("");

  function redeemWithCoins() {
    if (coins < 5) {
      setMessage("You need at least 5 coins to redeem 1 certificate.");
      return;
    }
    const nextCoins = coins - 5;
    localStorage.setItem("edookaCoins", String(nextCoins));
    setCoins(nextCoins);
    setMessage("Redeemed successfully! Certificate unlocked using referral coins.");
  }

  const plans = [
    { title: "Single certificate", price: 218, desc: "Best for one-time certification" },
    { title: "3 certificates pack", price: 500, desc: "Better value for repeat use" },
    { title: "5 certificates pack", price: 899, desc: "Most value for frequent learners" },
  ];

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Choose your package</h1>
      <p className="text-text-secondary">Attempt ID: {params.attemptId}</p>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.title} className="card-hover rounded-2xl border border-border-default bg-white p-5 shadow-[0_10px_24px_rgba(255,149,88,0.2)]">
            <h2 className="text-lg font-bold">{plan.title}</h2>
            <p className="mt-2 text-3xl font-extrabold text-primary">Rs. {plan.price}</p>
            <p className="mt-2 text-sm text-text-secondary">{plan.desc}</p>
            <button type="button" className="mt-4 rounded-xl bg-primary px-4 py-2 font-semibold text-white">
              Continue payment
            </button>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-primary/30 bg-soft-orange p-5">
        <h3 className="text-xl font-bold">Referral coins</h3>
        <p className="mt-1 text-text-secondary">Current coins: {coins} (5 coins = 1 certificate unlock)</p>
        <button
          type="button"
          onClick={redeemWithCoins}
          className="mt-3 rounded-xl border border-primary px-4 py-2 font-semibold text-primary card-hover"
        >
          Redeem 5 coins
        </button>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
      </article>
    </section>
  );
}
