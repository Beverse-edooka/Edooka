import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, programs } from "@/lib/db/schema";
import { getRandomQuestionsForAttempt } from "@/server/queries/questions";

/**
 * Function: startAttempt
 * Purpose: Starts a quiz attempt after enforcing retry lock rules.
 */
export async function startAttempt(userId: string, programSlug: string) {
  const program = await db.query.programs.findFirst({
    where: eq(programs.slug, programSlug),
  });

  if (!program) {
    throw new Error("Program not found");
  }

  const lastAttempt = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.programId, program.id)))
    .orderBy(desc(attempts.startedAt))
    .limit(1);

  if (
    lastAttempt[0]?.passed === false &&
    lastAttempt[0]?.nextRetryAllowedAt &&
    lastAttempt[0].nextRetryAllowedAt > new Date()
  ) {
    throw new Error("Retry locked");
  }

  const questionIds = (await getRandomQuestionsForAttempt(program.id)).map((q) => q.id);

  const [created] = await db
    .insert(attempts)
    .values({ userId, programId: program.id, questionIds })
    .returning();

  return created;
}
