/** Download certificate PNG from DB-backed API (correct name, course, QR on production). */
export async function downloadCertificatePng(input: { certificateNumber: string }): Promise<void> {
  const cert = encodeURIComponent(input.certificateNumber.trim());
  const res = await fetch(`/api/certificate/png/${cert}`);
  if (!res.ok) throw new Error("Could not generate certificate");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edooka-certificate-${input.certificateNumber}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
