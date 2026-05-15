"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMPANY_NAME } from "@/lib/site";

/**
 * Page: Validate Certificate — search by certificate number.
 */
export default function VerifySearchPage() {
  const router = useRouter();
  const [certNumber, setCertNumber] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = certNumber.trim();
    if (!trimmed) return;
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="mx-auto max-w-lg space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Validate certificate</p>
        <h1 className="text-3xl font-extrabold">Verify a {COMPANY_NAME} credential</h1>
        <p className="text-sm text-text-secondary">
          Enter the certificate number from the PDF (e.g. EDK-2026-00001) to confirm authenticity.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-border-default bg-white p-6 shadow-sm space-y-4"
      >
        <div>
          <label htmlFor="cert-number" className="block text-sm font-semibold mb-1">
            Certificate number
          </label>
          <input
            id="cert-number"
            value={certNumber}
            onChange={(e) => setCertNumber(e.target.value)}
            placeholder="EDK-2026-XXXXXXXX"
            className="w-full rounded-xl border border-border-default px-4 py-3 font-mono text-sm uppercase focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover transition-colors"
        >
          Verify certificate
        </button>
      </form>
    </section>
  );
}
