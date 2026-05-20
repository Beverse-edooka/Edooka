import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramBySlug } from "@/data/programs";
import { mapDbProgramToCard } from "@/lib/catalog-map";
import { minCorrectToPass, PASS_QUALIFY_COPY } from "@/lib/assessment-constants";
import { getActiveProgramBySlug } from "@/server/queries/programs";

/**
 * Page: ProgramDetail — same description as library/assessments (DB first, static fallback).
 */
export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbRow = await getActiveProgramBySlug(slug);
  const program = dbRow ? mapDbProgramToCard(dbRow) : getProgramBySlug(slug);

  if (!program) notFound();

  return (
    <section className="grid w-full gap-6 lg:grid-cols-[1fr_320px]">
      <article className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{program.category}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{program.title}</h1>
        <p className="leading-relaxed text-text-secondary">{program.description}</p>
        <div className="pt-4">
          <Link
            href={`/start/${program.slug}`}
            className="inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow transition-colors hover:bg-primary-hover"
          >
            Start free assessment →
          </Link>
        </div>
      </article>
      <aside className="h-fit space-y-3 rounded-2xl border border-border-default bg-white p-4">
        <h2 className="text-lg font-semibold">Free assessment</h2>
        <p className="text-sm text-text-muted">
          Questions: {program.questions} · Estimated time: {program.durationLabel}
        </p>
        <p className="text-sm text-text-muted">{PASS_QUALIFY_COPY}</p>
        <p className="text-sm text-text-muted">
          Pass mark: 50% ({minCorrectToPass(program.questions)} or more correct)
        </p>
        <p className="text-lg font-extrabold text-primary">Unlock certificate from ₹{program.price}</p>
      </aside>
    </section>
  );
}
