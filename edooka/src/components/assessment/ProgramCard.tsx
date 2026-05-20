import Link from "next/link";
import type { ProgramCard as Program } from "@/data/programs";
import { ASSESSMENT_DURATION_LABEL } from "@/lib/assessment-constants";

type Props = {
  program: Program;
  /** Show Start CTA (assessments module only). */
  showStart?: boolean;
};

/**
 * Shared assessment/library card — consistent sizing and hover across catalog pages.
 */
export function ProgramCardArticle({ program, showStart = true }: Props) {
  return (
    <article className="assessment-card group flex h-full min-h-[320px] flex-col rounded-2xl border border-border-default bg-white p-5 shadow-sm">
      <div className="flex flex-1 flex-col">
        <span className="inline-block w-fit rounded-full bg-soft-orange px-3 py-0.5 text-xs font-semibold text-primary">
          {program.badge}
        </span>

        <div className="mt-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-soft-orange">
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

        <Link href={`/assessment/${program.slug}`} className="mt-3 block">
          <h3 className="text-lg font-bold leading-snug transition-colors group-hover:text-primary">{program.title}</h3>
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">{program.description}</p>
        <p className="mt-3 text-sm text-text-muted">
          {program.questions} questions · {program.durationLabel || ASSESSMENT_DURATION_LABEL}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap gap-3 pt-5">
        {showStart ? (
          <Link
            href={`/start/${program.slug}`}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
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
