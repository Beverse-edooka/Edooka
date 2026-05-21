import type { ActiveAttempt } from "@/lib/session-keys";

/** Email required by /api/certificate/issue — synthesise when redeeming without one. */
export function emailForCertificateIssue(attempt: ActiveAttempt): string {
  const email = attempt.email?.trim().toLowerCase();
  if (email && email.includes("@")) return email;
  const safeId = attempt.attemptId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 48) || "learner";
  return `wallet+${safeId}@edooka.invalid`;
}

export async function persistCertificateIssue(input: {
  attempt: ActiveAttempt;
  certificateNumber: string;
  orderId: string;
  bundleKey?: string;
}): Promise<{ ok: true; verifyUrl: string } | { ok: false; error: string }> {
  const { attempt, certificateNumber, orderId, bundleKey = "single" } = input;

  try {
    const res = await fetch("/api/certificate/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: attempt.attemptId,
        orderId,
        bundleKey,
        slug: attempt.slug,
        certificateNumber,
        name: attempt.name,
        email: emailForCertificateIssue(attempt),
        phone: attempt.phone,
        programTitle: attempt.programTitle,
        score: attempt.examScore,
        total: attempt.examTotal,
        passed: attempt.examPassed,
      }),
    });

    if (!res.ok) {
      let error = "Could not register certificate";
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) error = data.error;
      } catch {
        /* ignore */
      }
      return { ok: false, error };
    }

    const data = (await res.json()) as { verifyUrl?: string };
    return { ok: true, verifyUrl: data.verifyUrl ?? "" };
  } catch {
    return { ok: false, error: "Network error while registering certificate" };
  }
}
