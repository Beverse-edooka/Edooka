import { AssessmentsGrid } from "@/components/assessment/AssessmentsGrid";

/**
 * Page: Library — course catalog with same layout as assessments (categories + Start).
 */
export default function LibraryPage() {
  return (
    <section className="w-full space-y-8">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          Library
        </p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Course library</h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Browse specialties and start a free skill validation assessment for each course.
        </p>
      </div>

      <AssessmentsGrid showStart />
    </section>
  );
}
