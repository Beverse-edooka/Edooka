import type { ProgramCard } from "@/data/programs";
import { ASSESSMENT_DURATION_LABEL, ASSESSMENT_NUM_QUESTIONS } from "@/lib/assessment-constants";

export type DbProgramRow = {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  numQuestions: number;
  durationMinutes: number;
  passThreshold?: number;
};

export function mapDbProgramToCard(row: DbProgramRow, badge = "New"): ProgramCard {
  const questions =
    row.numQuestions === 18 ? ASSESSMENT_NUM_QUESTIONS : row.numQuestions || ASSESSMENT_NUM_QUESTIONS;
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    description: row.description ?? "",
    questions,
    durationLabel: row.durationMinutes ? `${row.durationMinutes} min` : ASSESSMENT_DURATION_LABEL,
    price: 218,
    badge,
  };
}
