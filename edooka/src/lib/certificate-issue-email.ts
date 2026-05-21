/** Email for /api/certificate/issue (server + client). */
export function resolveCertificateIssueEmail(
  rawEmail: string | undefined,
  attemptId: string
): string {
  const email = rawEmail?.trim().toLowerCase();
  if (email && email.includes("@")) return email;
  const safeId = attemptId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 48) || "learner";
  return `wallet+${safeId}@edooka.invalid`;
}
