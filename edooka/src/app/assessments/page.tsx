import Link from "next/link";
import { PROGRAMS } from "@/data/programs";

/**
 * Page: Assessments catalog (same programs as home; deep-link from marketing).
 */
export default function AssessmentsPage() {
  return (
    <section className="space-y-10">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          All assessments
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">Pick your specialty</h1>
        <p className="mt-2 text-text-secondary max-w-2xl">
          Each assessment is free to attempt. After you qualify, choose a certificate package on the results screen.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/#assessments" className="font-semibold text-primary hover:underline">
            View on homepage →
          </Link>
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROGRAMS.map((item) => (
          <article
            key={item.slug}
            className="rounded-2xl border border-border-default bg-white p-5 shadow-sm hover:border-primary/40 transition-colors"
          >
            <span className="inline-block rounded-full bg-soft-orange px-3 py-0.5 text-xs font-semibold text-primary">
              {item.badge}
            </span>
            <h2 className="mt-4 text-lg font-bold">{item.title}</h2>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">{item.description}</p>
            <p className="mt-3 text-sm text-text-muted">
              {item.questions} questions · {item.durationLabel}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/start/${item.slug}`}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Start
              </Link>
              <Link href={`/assessment/${item.slug}`} className="rounded-full border border-border-default px-4 py-2 text-sm font-semibold card-hover">
                Details
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
