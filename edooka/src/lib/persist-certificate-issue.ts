import { resolveCertificateIssueEmail } from "@/lib/certificate-issue-email";
import type { ActiveAttempt } from "@/lib/session-keys";

export function emailForCertificateIssue(attempt: ActiveAttempt): string {
  return resolveCertificateIssueEmail(attempt.email, attempt.attemptId);
}

export async function persistCertificateIssue(input: {
  attempt: ActiveAttempt;
  certificateNumber: string;
  orderId: string;
  bundleKey?: string;
}): Promise<
  | {
      ok: true;
      verifyUrl: string;
      holderName?: string;
      programTitle?: string;
      programSlug?: string;
    }
  | { ok: false; error: string }
> {
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

    const data = (await res.json()) as {
      verifyUrl?: string;
      holderName?: string;
      programTitle?: string;
      programSlug?: string;
    };
    return {
      ok: true,
      verifyUrl: data.verifyUrl ?? "",
      holderName: data.holderName,
      programTitle: data.programTitle,
      programSlug: data.programSlug,
    };
  } catch {
    return { ok: false, error: "Network error while registering certificate" };
  }
}
