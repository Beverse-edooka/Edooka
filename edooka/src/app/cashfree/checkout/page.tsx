"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Cashfree hosted checkout handoff page.
 * Posts payment_session_id to /pg/view/sessions/checkout (sandbox or production).
 */
function CashfreeCheckoutInner() {
  const searchParams = useSearchParams();
  const session = searchParams.get("session") ?? "";
  const env = (searchParams.get("env") ?? "sandbox").toLowerCase();

  const actionUrl = useMemo(() => {
    return env === "production"
      ? "https://api.cashfree.com/pg/view/sessions/checkout"
      : "https://sandbox.cashfree.com/pg/view/sessions/checkout";
  }, [env]);

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
      <form id="cashfree-redirect-form" action={actionUrl} method="post" className="hidden">
        <input type="hidden" name="payment_session_id" value={session} />
      </form>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "window.setTimeout(function(){var f=document.getElementById('cashfree-redirect-form'); if(f){f.submit();}},80);",
        }}
      />
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

