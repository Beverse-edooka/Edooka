import { getProgramBySlug } from "@/data/programs";
import type { ActiveAttempt } from "@/lib/session-keys";

/** Fills program title/category from catalog when older stored rows omit them. */
export function normalizeLearnerAttempt(raw: ActiveAttempt): ActiveAttempt {
  const m = getProgramBySlug(raw.slug);
  return {
    ...raw,
    programTitle: raw.programTitle || m?.title || "",
    programCategory: raw.programCategory || m?.category || "",
  };
}
