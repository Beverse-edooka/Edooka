import type { CertificateRenderInput } from "@/lib/certificate-template";
import { persistCertificateIssue } from "@/lib/persist-certificate-issue";
import type { ActiveAttempt } from "@/lib/session-keys";

export type DownloadCertificateInput = {
  certificateNumber: string;
  /** Register in Postgres before download (fixes 404 when issue was skipped or failed). */
  register?: {
    attempt: ActiveAttempt;
    orderId: string;
    bundleKey?: string;
  };
  /** Used when PNG is still 404 or render-only path is needed. */
  fallback?: CertificateRenderInput;
};

async function readApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string; hint?: string };
    const parts = [data.error, data.hint].filter(Boolean);
    return parts.join(" — ") || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Download certificate PNG — register (optional), DB PNG, then render fallback. */
export async function downloadCertificatePng(input: DownloadCertificateInput): Promise<void> {
  let verifyUrl = input.fallback?.verifyUrl ?? "";

  if (input.register) {
    const persisted = await persistCertificateIssue({
      attempt: input.register.attempt,
      certificateNumber: input.certificateNumber,
      orderId: input.register.orderId,
      bundleKey: input.register.bundleKey,
    });
    if (!persisted.ok) {
      throw new Error(`Could not register certificate — ${persisted.error}`);
    }
    if (persisted.verifyUrl) verifyUrl = persisted.verifyUrl;
  }

  const cert = encodeURIComponent(input.certificateNumber.trim());
  let res = await fetch(`/api/certificate/png/${cert}?download=1`);

  const fallback: CertificateRenderInput | undefined = input.fallback
    ? {
        ...input.fallback,
        verifyUrl: verifyUrl || input.fallback.verifyUrl,
      }
    : undefined;

  if (!res.ok && fallback) {
    res = await fetch("/api/certificate/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fallback),
    });
  }

  if (!res.ok) {
    const detail = await readApiError(res);
    throw new Error(
      res.status === 404
        ? `Certificate not in database (${detail}). Complete payment/redeem again or call POST /api/certificate/issue first.`
        : `Could not generate certificate — ${detail}`,
    );
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edooka-certificate-${input.certificateNumber}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
