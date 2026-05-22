"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Cashfree hosted checkout handoff page.
 * Posts payment_session_id to /pg/view/sessions/checkout (sandbox or production).
 */
function CashfreeCheckoutInner() {
  const searchParams = useSearchParams();
  const session = searchParams.get("session") ?? "";
  const env = (searchParams.get("env") ?? "sandbox").toLowerCase();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const actionUrl = useMemo(() => {
    return env === "production"
      ? "https://api.cashfree.com/pg/view/sessions/checkout"
      : "https://sandbox.cashfree.com/pg/view/sessions/checkout";
  }, [env]);

  useEffect(() => {
    if (!session || !formRef.current || autoSubmitted) return;
    const timer = window.setTimeout(() => {
      formRef.current?.submit();
      setAutoSubmitted(true);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [autoSubmitted, session]);

  if (!session) {
    return (
      <section className="quiz-shell space-y-4 rounded-2xl border border-border-default bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">Checkout session missing</h1>
        <p className="text-sm text-text-secondary">
          Could not start Cashfree checkout. Go back and try again.
        </p>
      </section>
    );
  }

  return (
    <section className="quiz-shell rounded-2xl border border-border-default bg-white p-6 text-center shadow-sm">
      <p className="text-sm text-text-secondary">Redirecting to secure Cashfree checkout…</p>
      <form ref={formRef} action={actionUrl} method="post" className="hidden">
        <input type="hidden" name="payment_session_id" value={session} />
        <input type="hidden" name="platform" value="web" />
        <input
          type="hidden"
          name="browser_meta"
          value={
            typeof window !== "undefined"
              ? window.btoa(JSON.stringify({ userAgent: window.navigator.userAgent }))
              : ""
          }
        />
      </form>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => formRef.current?.submit()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Continue to Cashfree
        </button>
      </div>
    </section>
  );
}

export default function CashfreeCheckoutPage() {
  return (
    <Suspense
      fallback={
        <section className="quiz-shell rounded-2xl border border-border-default bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-text-secondary">Preparing secure checkout…</p>
        </section>
      }
    >
      <CashfreeCheckoutInner />
    </Suspense>
  );
}

