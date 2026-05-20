/** Download certificate PNG from template API (no cloud storage). */
export async function downloadCertificatePng(input: {
  fullName: string;
  courseName: string;
  certificateNumber: string;
  verifyUrl: string;
}): Promise<void> {
  const res = await fetch("/api/certificate/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Could not generate certificate");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edooka-certificate-${input.certificateNumber}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
