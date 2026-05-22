import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  meta: string[];
  children: ReactNode;
};

/** Shared layout for Terms, Privacy, and Refund legal pages. */
export function LegalPageShell({ eyebrow, title, subtitle, meta, children }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-2 text-text-secondary">{subtitle}</p>
      <ul className="mt-4 space-y-1 text-sm text-text-muted">
        {meta.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="prose prose-orange mt-10 max-w-none text-text-secondary prose-headings:text-foreground prose-h2:mt-10 prose-h2:text-xl prose-h3:mt-6 prose-h3:text-base">
        {children}
      </div>
    </div>
  );
}
