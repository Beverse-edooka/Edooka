import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import type { AssessmentQuestion } from "@/lib/assessment";

export type QuestionRow = typeof questions.$inferSelect;

const LETTER_TO_INDEX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

/**
 * Maps a DB question row to the shape used by the timed quiz UI.
 */
export function mapDbQuestionToAssessment(row: QuestionRow): AssessmentQuestion {
  const letter = row.correctOption?.trim().toLowerCase() ?? "a";
  const correctIndex = LETTER_TO_INDEX[letter] ?? 0;
  return {
    id: row.id,
    questionText: row.questionText,
    options: [row.optionA, row.optionB, row.optionC, row.optionD],
    correctIndex,
  };
}

/**
 * Returns up to `count` random questions for one program (fewer if the bank is smaller).
 */
export async function getRandomQuestionsForAttempt(programId: string, count = 18) {
  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.programId, programId))
    .orderBy(sql`RANDOM()`)
    .limit(count);

  return rows;
}
