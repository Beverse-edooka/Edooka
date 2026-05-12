import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Page: ProgramDetail
 * Purpose: Displays details for one program by slug.
 */
export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await db.query.programs.findFirst({
    where: and(eq(programs.slug, slug), eq(programs.isActive, true)),
  });

  if (!program) notFound();

  return (
    <section className="grid gap-6 md:grid-cols-[1fr_320px]">
      <article className="space-y-3">
        <h1 className="text-3xl font-bold">{program.title}</h1>
        <p className="text-text-secondary">{program.description}</p>
      </article>
      <aside className="h-fit rounded-2xl border border-border-default bg-white p-4">
        <h2 className="text-lg font-semibold">Free assessment</h2>
        <p className="mt-2 text-sm text-text-muted">Questions: 18 · Pass mark: 50%</p>
      </aside>
    </section>
  );
}
