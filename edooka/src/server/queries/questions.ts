import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import type { AssessmentQuestion } from "@/lib/assessment";

export type QuestionRow = typeof questions.$inferSelect;

const LETTER_TO_INDEX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

export function mapDbQuestionToAssessment(row: {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
}): AssessmentQuestion {
  const letter = row.correctOption?.trim().toLowerCase() ?? "a";
  const correctIndex = LETTER_TO_INDEX[letter] ?? 0;
  return {
    id: row.id,
    questionText: row.questionText,
    options: [row.optionA, row.optionB, row.optionC, row.optionD],
    correctIndex,
  };
}

function shufflePick<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/**
 * Loads questions for a program and shuffles in memory (faster than SQL RANDOM() on Neon).
 */
export async function getRandomQuestionsForAttempt(programId: string, count = 15) {
  const rows = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      optionA: questions.optionA,
      optionB: questions.optionB,
      optionC: questions.optionC,
      optionD: questions.optionD,
      correctOption: questions.correctOption,
    })
    .from(questions)
    .where(eq(questions.programId, programId));

  return shufflePick(rows, Math.min(count, rows.length));
}
