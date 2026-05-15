/** Shared assessment timing and pass rules across marketing and exam flows. */
export const ASSESSMENT_NUM_QUESTIONS = 15;
export const ASSESSMENT_DURATION_MINUTES = 15;
export const ASSESSMENT_DURATION_LABEL = "15 min";
export const PASS_THRESHOLD_PERCENT = 50;

/** Minimum correct answers to pass (8 of 15 = 53.3%, satisfies 50% rule). */
export function minCorrectToPass(total: number, passThresholdPercent = PASS_THRESHOLD_PERCENT): number {
  return Math.ceil((total * passThresholdPercent) / 100);
}

export const PASS_QUALIFY_COPY = "Answer 8 or more questions correctly (50% or more) to qualify.";
