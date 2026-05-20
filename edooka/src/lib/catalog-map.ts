import type { ProgramCard } from "@/data/programs";
import { ASSESSMENT_DURATION_LABEL } from "@/lib/assessment-constants";

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
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    description: row.description ?? "",
    questions: row.numQuestions,
    durationLabel: row.durationMinutes ? `${row.durationMinutes} min` : ASSESSMENT_DURATION_LABEL,
    price: 218,
    badge,
  };
}
