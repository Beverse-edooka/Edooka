import type { CertificateRenderInput } from "@/lib/certificate-template";

export type DownloadCertificateInput = {
  certificateNumber: string;
  /** Used when the cert is not in Postgres yet (e.g. issue still pending). */
  fallback?: CertificateRenderInput;
};

async function readApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error?.trim() || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Download certificate PNG — DB route first, optional client render fallback. */
export async function downloadCertificatePng(input: DownloadCertificateInput): Promise<void> {
  const cert = encodeURIComponent(input.certificateNumber.trim());
  let res = await fetch(`/api/certificate/png/${cert}`);

  if (!res.ok && input.fallback) {
    res = await fetch("/api/certificate/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.fallback),
    });
  }

  if (!res.ok) {
    const detail = await readApiError(res);
    throw new Error(
      res.status === 404
        ? `Certificate not registered yet — ${detail}. Wait a moment and try again.`
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
