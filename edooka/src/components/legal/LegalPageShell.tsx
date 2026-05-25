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
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-3 text-text-secondary">{subtitle}</p>
        <ul className="mt-4 space-y-1 text-sm text-text-muted">
          {meta.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </header>
      <article className="legal-prose mt-10 w-full text-left text-text-secondary [&_h2]:text-left [&_h2]:font-extrabold [&_h3]:text-left [&_p]:text-justify [&_li]:text-justify">
        {children}
      </article>
    </div>
  );
}
