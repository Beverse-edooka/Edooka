import Link from "next/link";
import type { ProgramCard as Program } from "@/data/programs";
import { ASSESSMENT_DURATION_LABEL } from "@/lib/assessment-constants";

type Props = {
  program: Program;
  /** Show Start CTA (assessments module only). */
  showStart?: boolean;
};

/**
 * Shared assessment/library card — consistent styling across catalog pages.
 */
export function ProgramCardArticle({ program, showStart = true }: Props) {
  return (
    <article className="group rounded-2xl border border-border-default bg-white p-5 shadow-sm hover:border-primary/40 transition-colors">
      <span className="inline-block rounded-full bg-soft-orange px-3 py-0.5 text-xs font-semibold text-primary">
        {program.badge}
      </span>

      <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-soft-orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            stroke="#ff6b35"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <Link href={`/assessment/${program.slug}`} className="block mt-3">
        <h3 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors">{program.title}</h3>
      </Link>
      <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-3">{program.description}</p>
      <p className="mt-3 text-sm text-text-muted">
        {program.questions} questions · {program.durationLabel || ASSESSMENT_DURATION_LABEL}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {showStart ? (
          <Link
            href={`/start/${program.slug}`}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            Start
          </Link>
        ) : null}
        <Link
          href={`/assessment/${program.slug}`}
          className="rounded-full border border-border-default px-4 py-2 text-sm font-semibold card-hover"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
