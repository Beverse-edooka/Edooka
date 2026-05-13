/**
 * Deterministic-style certificate numbers for demo and email delivery.
 */
export function certificateNumberForAttempt(attemptId: string): string {
  const year = new Date().getFullYear();
  const compact = attemptId.replace(/-/g, "");
  const suffix = compact.slice(0, 8).toUpperCase();
  return `EDK-${year}-${suffix}`;
}
