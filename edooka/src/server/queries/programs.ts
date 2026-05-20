import { unstable_cache } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";

async function fetchActiveProgramBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.slug, slug), eq(programs.isActive, true)))
    .limit(1);
  return row ?? null;
}

/** Cached program lookup — reduces repeated Neon round-trips per slug. */
export async function getActiveProgramBySlug(slug: string) {
  return unstable_cache(async () => fetchActiveProgramBySlug(slug), ["program", slug], {
    revalidate: 120,
  })();
}
