"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PricingTiers } from "@/components/pricing/PricingTiers";

function PricingInner() {
  const params = useParams<{ attemptId: string }>();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const backHref = `/result/${params.attemptId}${query ? `?${query}` : ""}`;

  return (
    <PricingTiers attemptId={params.attemptId} backHref={backHref} backLabel="← Back to congratulations" />
  );
}

export default function ResultPricingPage() {
  return (
    <Suspense fallback={<section className="py-16 text-center text-text-muted">Loading pricing…</section>}>
      <PricingInner />
    </Suspense>
  );
}
