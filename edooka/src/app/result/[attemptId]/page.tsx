"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

/**
 * Page: Result
 * Purpose: Shows pass/fail with social sharing and certificate unlock options.
 */
export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const searchParams = useSearchParams();
  const score = Number(searchParams.get("score") ?? 0);
  const total = Number(searchParams.get("total") ?? 18);
  const passed = score >= 9;

  const shareText = useMemo(
    () => encodeURIComponent("I completed an Edooka assessment. Check this platform: https://edooka.in"),
    [],
  );

  return (
    <section className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-border-default bg-white p-6 shadow-[0_12px_26px_rgba(255,149,88,0.24)]">
      {passed ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-light p-6 text-white">
            <p className="text-sm uppercase tracking-[0.16em]">Congratulations</p>
            <h1 className="mt-2 text-3xl font-extrabold">You qualified!</h1>
            <p className="mt-2">
              Great work. You scored {score} out of {total}. You are now eligible for certificate unlock.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="rounded-xl border border-border-default px-4 py-2 font-semibold card-hover"
              target="_blank"
              rel="noreferrer"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://edooka.in")}`}
            >
              Share on LinkedIn
            </a>
            <a
              className="rounded-xl border border-border-default px-4 py-2 font-semibold card-hover"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/?text=${shareText}`}
            >
              Share on WhatsApp
            </a>
            <Link href={`/checkout/${params.attemptId}`} className="rounded-xl bg-primary px-4 py-2 font-semibold text-white">
              Download certificate
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold">Almost there</h1>
          <p className="text-lg">
            You got <span className="font-bold text-primary">{score}</span> of {total} correct.
            You need 9 or more to qualify.
          </p>
          <Link href="/quiz/general" className="inline-flex rounded-xl bg-primary px-4 py-2 font-semibold text-white">
            Try again with shuffled questions
          </Link>
        </div>
      )}
    </section>
  );
}
