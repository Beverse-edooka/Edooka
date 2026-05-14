import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";

/**
 * Returns an active program row by public slug, or null.
 */
export async function getActiveProgramBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.slug, slug), eq(programs.isActive, true)))
    .limit(1);
  return row ?? null;
}
