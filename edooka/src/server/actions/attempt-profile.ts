import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, programs, users } from "@/lib/db/schema";
import { resolveCertificateIssueEmail } from "@/lib/certificate-issue-email";
import { getActiveProgramBySlug } from "@/server/queries/programs";

export type UpsertAttemptProfileInput = {
  attemptId: string;
  slug: string;
  name?: string;
  email?: string;
  phone?: string;
};

/**
 * Persists a learner profile + stub attempt row server-side before payment.
 * Survives mobile browser handoffs after Cashfree redirect where localStorage can be lost.
 */
export async function upsertAttemptProfile(input: UpsertAttemptProfileInput): Promise<
  | { ok: true; userId: string; programId: string }
  | { ok: false; error: string }
> {
  const attemptId = input.attemptId.trim();
  const slug = input.slug.trim();
  if (!attemptId || !slug) return { ok: false, error: "missing_attempt_or_slug" };

  const name = (input.name?.trim() || "Learner").slice(0, 120);
  const phone = (input.phone?.trim() || "0000000000").slice(0, 32);
  const email = resolveCertificateIssueEmail(input.email, attemptId);

  try {
    let program = await getActiveProgramBySlug(slug);
    if (!program) {
      const [row] = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
      program = row ?? null;
    }
    if (!program) return { ok: false, error: "program_not_found" };

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      [user] = await db
        .insert(users)
        .values({ name, email, phone })
        .returning();
    } else {
      const isPlaceholder = !user.name || user.name.trim().toLowerCase() === "learner";
      const updates: Partial<typeof users.$inferInsert> = {};
      if (isPlaceholder && name && name.toLowerCase() !== "learner") updates.name = name;
      if ((!user.phone || user.phone === "0000000000") && phone && phone !== "0000000000") {
        updates.phone = phone;
      }
      if (Object.keys(updates).length > 0) {
        const [updated] = await db.update(users).set(updates).where(eq(users.id, user.id)).returning();
        if (updated) user = updated;
      }
    }

    const [existingAttempt] = await db
      .select()
      .from(attempts)
      .where(eq(attempts.id, attemptId))
      .limit(1);

    if (!existingAttempt) {
      await db.insert(attempts).values({
        id: attemptId,
        userId: user.id,
        programId: program.id,
        questionIds: [],
      });
    } else if (existingAttempt.userId !== user.id) {
      await db.update(attempts).set({ userId: user.id }).where(eq(attempts.id, attemptId));
    }

    return { ok: true, userId: user.id, programId: program.id };
  } catch (e) {
    console.error("[upsertAttemptProfile]", e);
    return { ok: false, error: e instanceof Error ? e.message : "unknown_error" };
  }
}

export type AttemptProfileLookup =
  | {
      ok: true;
      attemptId: string;
      holderName: string;
      email: string;
      phone: string;
      programSlug: string;
      programTitle: string;
      programCategory: string;
    }
  | { ok: false; error: string };

export async function getAttemptProfile(attemptId: string): Promise<AttemptProfileLookup> {
  const id = attemptId.trim();
  if (!id) return { ok: false, error: "missing_attempt_id" };

  try {
    const [row] = await db
      .select({
        attemptId: attempts.id,
        userId: attempts.userId,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        programSlug: programs.slug,
        programTitle: programs.title,
        programCategory: programs.category,
      })
      .from(attempts)
      .innerJoin(users, eq(attempts.userId, users.id))
      .innerJoin(programs, eq(attempts.programId, programs.id))
      .where(eq(attempts.id, id))
      .limit(1);

    if (!row) return { ok: false, error: "not_found" };

    return {
      ok: true,
      attemptId: row.attemptId,
      holderName: row.userName,
      email: row.userEmail,
      phone: row.userPhone,
      programSlug: row.programSlug,
      programTitle: row.programTitle,
      programCategory: row.programCategory,
    };
  } catch (e) {
    console.error("[getAttemptProfile]", e);
    return { ok: false, error: e instanceof Error ? e.message : "lookup_failed" };
  }
}
