/** Session key for the in-progress assessment funnel (lead → quiz → result → checkout). */
export const EDOOKA_ATTEMPT_KEY = "edooka_active_attempt";

/** Durable backup in localStorage (same browser) if sessionStorage is cleared. */
export function learnerProfileStorageKey(attemptId: string): string {
  return `edooka_learner_${attemptId}`;
}

export type ActiveAttempt = {
  attemptId: string;
  slug: string;
  /** Course title at time of registration (for certificates and email). */
  programTitle: string;
  programCategory: string;
  name: string;
  email: string;
  phone: string;
  startedAt: number;
  /** Set after exam when the learner qualifies (optional for older stored rows). */
  examPassed?: boolean;
  examScore?: number;
  examTotal?: number;
  examCompletedAt?: number;
};

export function persistLearnerProfile(profile: ActiveAttempt): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(learnerProfileStorageKey(profile.attemptId), JSON.stringify(profile));
  } catch {
    /* storage full or disabled */
  }
}

export function readLearnerProfile(attemptId: string): ActiveAttempt | null {
  if (typeof window === "undefined" || !attemptId) return null;
  try {
    const raw = localStorage.getItem(learnerProfileStorageKey(attemptId));
    if (!raw) return null;
    return JSON.parse(raw) as ActiveAttempt;
  } catch {
    return null;
  }
}
