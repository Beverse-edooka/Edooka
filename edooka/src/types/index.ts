/**
 * File: shared types
 * Purpose: Common project types reused in UI, queries and actions.
 */
export type BundleType = "single" | "bundle3" | "bundle5";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface Question {
  id: string;
  programId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
}
