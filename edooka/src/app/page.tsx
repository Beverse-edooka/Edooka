"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROGRAMS, type ProgramCard } from "@/data/programs";

/**
 * Page: HomePage
 * Purpose: Centered hero, stats, assessments with view-more, how-it-works (pricing moved to post-result checkout).
 */

const dynamicPhrases = ["15 minutes", "a single step", "one assessment"];

const howItWorks = [
  { number: "01", title: "Take the free assessment", description: "18 questions, one per screen. 15 minutes. Designed by domain experts." },
  { number: "02", title: "Qualify and unlock", description: "Score 50% or above to qualify. Unlock your certificate from ₹218." },
  { number: "03", title: "Share your credential", description: "PDF cert delivered via email and WhatsApp. Share on LinkedIn instantly." },
];

const stats = [
  { value: "06+", label: "ASSESSMENTS" },
  { value: "18", label: "AVG. TIME" },
  { value: "₹218", label: "STARTING" },
  { value: "100%", label: "DIGITAL" },
];

type FilterType = "All" | "Diagnostics" | "Clinical";

const TRENDING_COUNT = 3;

export default function Home() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [filter, setFilter] = useState<FilterType>("All");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((p) => (p + 1) % dynamicPhrases.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setShowAll(false);
  }, [filter]);

  const allFiltered: ProgramCard[] =
    filter === "All" ? PROGRAMS : PROGRAMS.filter((a) => a.category === filter);

  const trending = allFiltered.filter((a) => a.badge === "Trending");
  const nonTrending = allFiltered.filter((a) => a.badge !== "Trending");
  const sorted = [...trending, ...nonTrending];
  const visible_cards = showAll ? sorted : sorted.slice(0, TRENDING_COUNT);

  return (
    <div className="space-y-20 py-4">
      {/* ── Hero (centered) ── */}
      <section className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          Skill Validation for Healthcare Professionals
        </p>

        <h1 className="text-5xl font-extrabold tracking-tight leading-tight md:text-6xl text-foreground">
          Get certified in{" "}
          <span
            className="block text-primary transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {dynamicPhrases[phraseIndex]}
          </span>
        </h1>

        <p className="text-base text-black leading-relaxed max-w-xl mx-auto">
          Take a free 15-minute assessment in your specialty. Earn a verifiable certificate you can share on LinkedIn
          and your resume.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <motion.div
            whileHover={{ scale: 1.04, backgroundColor: "#18181b", color: "#ffffff" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-lg border-2 border-foreground bg-white px-6 py-3 font-semibold text-foreground shadow-sm cursor-pointer select-none"
          >
            <a href="#assessments" className="block">
              Take free assessment
            </a>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04, backgroundColor: "#18181b", color: "#ffffff" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-lg border-2 border-foreground bg-white px-6 py-3 font-semibold text-foreground shadow-sm cursor-pointer select-none"
          >
            <a href="#how-it-works" className="block">
              How it works
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Cards ── */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            whileHover={{ y: -5, boxShadow: "0 16px 32px rgba(255,107,53,0.18)" }}
            className="rounded-2xl border border-border-default bg-white p-6 text-center shadow-sm"
          >
            <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-black">{stat.label}</p>
          </motion.div>
        ))}
      </section>

      {/* ── Assessments ── */}
      <section className="space-y-6" id="assessments">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              Assessments
            </p>
            <h2 className="mt-1 text-3xl font-extrabold">Pick your assessment</h2>
          </div>

          <div className="flex gap-2">
            {(["All", "Diagnostics", "Clinical"] as FilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  filter === f
                    ? "bg-primary text-white shadow"
                    : "bg-white border border-border-default text-text-primary hover:border-primary/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible_cards.map((item, i) => (
              <motion.article
                key={item.slug}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                whileHover={{
                  y: -6,
                  borderColor: "rgba(255,107,53,0.5)",
                  boxShadow: "0 18px 36px rgba(255,107,53,0.18)",
                }}
                className="group rounded-2xl border border-border-default bg-white p-5 shadow-sm"
                style={{ transition: "border-color 0.28s ease" }}
              >
                <span className="inline-block rounded-full bg-soft-orange px-3 py-0.5 text-xs font-semibold text-primary">
                  {item.badge}
                </span>

                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-soft-orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      stroke="#ff6b35"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <Link href={`/assessment/${item.slug}`} className="block mt-3">
                  <h3 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors">{item.title}</h3>
                </Link>
                <p className="mt-1 text-sm text-text-muted">
                  {item.questions} questions · {item.durationLabel}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-primary">₹{item.price}</span>
                  <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href={`/start/${item.slug}`}
                      className="rounded-full bg-soft-orange px-4 py-1.5 text-sm font-semibold text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:bg-primary group-hover:text-white"
                    >
                      Start →
                    </Link>
                  </motion.div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {sorted.length > TRENDING_COUNT && (
          <div className="flex justify-center pt-2">
            <motion.button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              whileHover={{ scale: 1.05, backgroundColor: "#ff6b35", color: "#fff" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="rounded-full border-2 border-primary px-8 py-2.5 text-sm font-semibold text-primary transition-colors"
            >
              {showAll ? "Show less ↑" : `View more (${sorted.length - TRENDING_COUNT} more) ↓`}
            </motion.button>
          </div>
        )}
      </section>

      {/* ── How It Works ── */}
      <section className="rounded-3xl bg-soft-orange px-6 py-12 space-y-8" id="how-it-works">
        <div className="text-center max-w-2xl mx-auto">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            How it works
          </p>
          <h2 className="mt-1 text-3xl font-extrabold">Three steps to certification</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {howItWorks.map((step, i) => (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              whileHover={{ y: -4, boxShadow: "0 12px 28px rgba(255,107,53,0.14)" }}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <p className="text-5xl font-extrabold text-primary/20">{step.number}</p>
              <h3 className="mt-3 text-base font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
