"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Component: Nav
 * Purpose: Top navigation with Framer Motion hover effects + Refer a Friend referral modal.
 */

const navLinks = [
  { href: "/verify", label: "Validate Certificate" },
  { href: "/library", label: "Library" },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coins, setCoins] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("edookaCoins") ?? 0);
  });

  // Generate a persistent referral code for the user
  const referralCode = useState(() => {
    if (typeof window === "undefined") return "demo-code";
    let code = localStorage.getItem("edookaReferralCode");
    if (!code) {
      code = btoa("user-" + Date.now()).slice(0, 10);
      localStorage.setItem("edookaReferralCode", code);
    }
    return code;
  })[0];

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : "https://edooka.in"}/?ref=${referralCode}`;

  // Check if user came via referral and store it
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    if (refCode && !localStorage.getItem("edookaReferredBy")) {
      localStorage.setItem("edookaReferredBy", refCode);
    }
    
    // Check for referral coins awarded to this user
    const myReferralCode = localStorage.getItem("edookaReferralCode");
    if (myReferralCode) {
      const referralCoinKey = `edookaCoins_${myReferralCode}`;
      const referralCoins = Number(localStorage.getItem(referralCoinKey) ?? 0);
      if (referralCoins > 0) {
        const currentCoins = Number(localStorage.getItem("edookaCoins") ?? 0);
        localStorage.setItem("edookaCoins", String(currentCoins + referralCoins));
        localStorage.removeItem(referralCoinKey); // Clear after claiming
        setTimeout(() => {
          setCoins(currentCoins + referralCoins);
        }, 0);
      }
    }
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border-default bg-background/90 py-3 backdrop-blur sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
              e
            </span>
            <span className="text-lg font-bold tracking-tight">edooka</span>
          </Link>

          <nav className="hidden items-center gap-4 text-sm font-medium md:flex lg:gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="relative group py-1 whitespace-nowrap">
                <span className="relative z-10 transition-colors group-hover:text-primary">{link.label}</span>
                <motion.span
                  className="absolute bottom-0 left-0 h-0.5 rounded-full bg-primary"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </Link>
            ))}
            <motion.button
              type="button"
              onClick={() => setShowReferral(true)}
              whileHover={{ scale: 1.05, backgroundColor: "#ff6b35", color: "#ffffff" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition-colors lg:px-4"
            >
              🎁 Refer a Friend
            </motion.button>
          </nav>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg border border-border-default p-2 text-sm font-semibold md:hidden"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex flex-col gap-3 overflow-hidden border-t border-border-default pt-3 text-sm font-medium md:hidden"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-2 py-2 hover:bg-soft-orange hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setShowReferral(true);
                }}
                className="rounded-lg border border-primary px-3 py-2 text-left text-primary"
              >
                🎁 Refer a Friend
              </button>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Referral Modal */}
      <AnimatePresence>
        {showReferral && (
          <motion.div
            key="referral-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowReferral(false); }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-extrabold">Refer a Friend 🎁</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Share your link. When your friend completes an assessment, you earn{" "}
                    <span className="font-bold text-primary">+1 coin</span>.
                  </p>
                </div>
                <button
                  onClick={() => setShowReferral(false)}
                  className="ml-4 rounded-full p-1 text-text-muted hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Coin balance display */}
              <div className="rounded-xl bg-gradient-to-r from-primary to-primary-light p-4 text-white">
                <p className="text-sm font-semibold opacity-90">Your Referral Wallet</p>
                <p className="text-3xl font-extrabold mt-1">{coins} coins 🪙</p>
                <p className="text-xs mt-1 opacity-80">5 coins = 1 free certificate unlock</p>
              </div>

              {/* Referral link box */}
              <div className="flex items-center gap-2 rounded-xl border border-border-default bg-soft-orange px-4 py-3">
                <span className="flex-1 truncate text-sm font-mono text-text-secondary select-all">
                  {referralLink}
                </span>
                <motion.button
                  onClick={copyLink}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary-hover"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </motion.button>
              </div>

              {/* Share options */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("Join edooka – validate your healthcare skills! Use my referral link: " + referralLink)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border-default py-2.5 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border-default py-2.5 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
