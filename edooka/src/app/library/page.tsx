import { ProgramCardArticle } from "@/components/assessment/ProgramCard";
import { PROGRAMS } from "@/data/programs";

/**
 * Page: Library — course catalog with assessment-style cards.
 */
export default function LibraryPage() {
  return (
    <section className="space-y-10">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          Library
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">Course library</h1>
        <p className="mt-2 text-text-secondary max-w-2xl">
          Browse specialties and start a free skill validation assessment for each course.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROGRAMS.map((item) => (
          <ProgramCardArticle key={item.slug} program={item} showStart={false} />
        ))}
      </div>
    </section>
  );
}
