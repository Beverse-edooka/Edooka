"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AssessmentsGrid } from "@/components/assessment/AssessmentsGrid";
import { PASS_QUALIFY_COPY } from "@/lib/assessment-constants";
import { getRemainingCredits } from "@/lib/certificate-wallet";

/**
 * Page: Assessments catalog with all category filters.
 */
export default function AssessmentsPage() {
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    setCredits(getRemainingCredits());
  }, []);

  return (
    <section className="space-y-10 w-full max-w-6xl">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          All assessments
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">Pick your specialty</h1>
        <p className="mt-2 text-text-secondary max-w-2xl">
          Each assessment is free to attempt. {PASS_QUALIFY_COPY} After you qualify, choose a certificate package on
          the results screen.
        </p>
        {credits > 0 ? (
          <p className="mt-2 text-sm font-semibold text-primary">
            You have {credits} prepaid certificate download{credits > 1 ? "s" : ""} available.
          </p>
        ) : null}
        <p className="mt-3 text-sm">
          <Link href="/#assessments" className="font-semibold text-primary hover:underline">
            View on homepage →
          </Link>
        </p>
      </div>

      <AssessmentsGrid showStart />
    </section>
  );
}
