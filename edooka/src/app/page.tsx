"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AssessmentsGrid } from "@/components/assessment/AssessmentsGrid";
import { ASSESSMENT_DURATION_LABEL } from "@/lib/assessment-constants";
import { PROGRAMS } from "@/data/programs";

/**
 * Page: HomePage
 * Purpose: Centered hero, stats, assessments with view-more, how-it-works (pricing moved to post-result checkout).
 */

const dynamicPhrases = ["15 minutes", "a single step", "one assessment"];

const howItWorks = [
  { number: "01", title: "Take the free assessment", description: "Complete 15 expert-designed questions in a focused 15-minute assessment experience." },
  { number: "02", title: "Qualify and unlock", description: "Prove your expertise. Pass the assessment and unlock your professional certification from ₹218." },
  { number: "03", title: "Share your credential", description: "Receive your certificate directly by email and share your achievement instantly on WhatsApp or LinkedIn." },
];

const TRENDING_COUNT = 3;

function formatAssessmentCount(count: number): string {
  const n = Math.max(0, count);
  if (n >= 10) return `${n}+`;
  return `${String(n).padStart(2, "0")}+`;
}

export default function Home() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [assessmentCount, setAssessmentCount] = useState(PROGRAMS.length);

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
    fetch("/api/catalog/stats")
      .then((r) => r.json())
      .then((data: { assessmentCount?: number }) => {
        if (typeof data.assessmentCount === "number" && data.assessmentCount > 0) {
          setAssessmentCount(data.assessmentCount);
        }
      })
      .catch(() => {});
  }, []);

  const stats = [
    { value: formatAssessmentCount(assessmentCount), label: "ASSESSMENTS" },
    { value: ASSESSMENT_DURATION_LABEL, label: "TIME" },
    { value: "₹0", label: "ASSESSMENT" },
    { value: "100%", label: "DIGITAL" },
  ];

  return (
    <div className="w-full">
      {/* First screen: hero centered, four stat cards anchored to bottom (Windows + macOS) */}
      <section className="home-hero-fold">
        <div className="home-hero-fold__hero space-y-3 sm:space-y-4">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            Skill Validation for Healthcare Professionals
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight leading-[1.15] sm:text-4xl md:text-5xl text-foreground">
            Get certified in{" "}
            <span
              className="block text-primary transition-opacity duration-300"
              style={{ opacity: visible ? 1 : 0 }}
            >
              {dynamicPhrases[phraseIndex]}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-black leading-snug max-w-xl mx-auto">
            Take a free 15-minute assessment in your specialty. Earn a verifiable certificate you can share on LinkedIn
            and your resume.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5 pt-0.5">
            <motion.div
              whileHover={{
                scale: 1.04,
                backgroundColor: "#ff9a60",
                color: "#000000",
                boxShadow: "0 18px 40px rgba(255,154,96,0.24)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-lg bg-white px-4 py-2 sm:px-5 sm:py-2.5 font-semibold text-sm text-black shadow-sm cursor-pointer select-none"
            >
              <a href="#assessments" className="block">
                Take free assessment
              </a>
            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.04,
                backgroundColor: "#ff9a60",
                color: "#000000",
                boxShadow: "0 18px 40px rgba(255,154,96,0.24)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-lg bg-white px-4 py-2 sm:px-5 sm:py-2.5 font-semibold text-sm text-black shadow-sm cursor-pointer select-none"
            >
              <a href="#how-it-works" className="block">
                How it works
              </a>
            </motion.div>
          </div>
        </div>

        <section className="home-hero-fold__stats grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -5, boxShadow: "0 16px 32px rgba(255,107,53,0.18)" }}
              className="stat-card rounded-2xl border border-border-default bg-white p-4 sm:p-5 text-center shadow-sm"
            >
              <p className="text-2xl sm:text-3xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-1 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-black">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </section>
      </section>

      <div className="w-full space-y-8 md:space-y-10 pt-6 md:pt-8">
      {/* ── Assessments ── */}
      <section className="space-y-6 w-full" id="assessments">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center md:text-left"
        >
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary md:justify-start">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            Assessments
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold">Pick your assessment</h2>
        </motion.div>
        <AssessmentsGrid showStart trendingLimit={TRENDING_COUNT} showViewMore />
      </section>

      {/* ── How It Works ── */}
      <section className="rounded-3xl bg-soft-orange px-4 py-10 sm:px-6 sm:py-12 space-y-8" id="how-it-works">
        <div className="text-center max-w-2xl mx-auto">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            How it works
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold">Three steps to certification</h2>
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
              className="how-card rounded-2xl bg-white p-6 shadow-sm"
            >
              <p className="text-5xl font-extrabold text-primary/20">{step.number}</p>
              <h3 className="mt-3 text-base font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
