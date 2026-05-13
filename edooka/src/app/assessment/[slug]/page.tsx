import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramBySlug } from "@/data/programs";

/**
 * Page: ProgramDetail
 * Purpose: Assessment detail from static catalog (no database required).
 */
export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program) notFound();

  return (
    <section className="grid gap-6 md:grid-cols-[1fr_320px]">
      <article className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {program.category}
        </p>
        <h1 className="text-3xl font-bold">{program.title}</h1>
        <p className="text-text-secondary leading-relaxed">{program.description}</p>
        <div className="pt-4">
          <Link
            href={`/start/${program.slug}`}
            className="inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow hover:bg-primary-hover transition-colors"
          >
            Start free assessment →
          </Link>
        </div>
      </article>
      <aside className="h-fit rounded-2xl border border-border-default bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">Free assessment</h2>
        <p className="text-sm text-text-muted">
          Questions: {program.questions} · Estimated time: {program.durationLabel}
        </p>
        <p className="text-sm text-text-muted">Pass mark: 50% (9 or more correct)</p>
        <p className="text-lg font-extrabold text-primary">Unlock certificate from ₹{program.price}</p>
      </aside>
    </section>
  );
}
