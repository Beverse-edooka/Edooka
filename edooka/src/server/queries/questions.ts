import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";

/**
 * Function: getRandomQuestionsForAttempt
 * Purpose: Returns a fresh random set of questions for a quiz attempt.
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
