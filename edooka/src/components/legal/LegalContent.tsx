import type { ReactNode } from "react";

type LegalSectionProps = {
  title: string;
  children: ReactNode;
};

/** Major numbered section (h2). Spacing is handled by `.legal-prose` CSS. */
export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <>
      <h2>{title}</h2>
      {children}
    </>
  );
}

type LegalSubsectionProps = {
  title: string;
  children: ReactNode;
};

/** Distinguished subheading (h3). Spacing is handled by `.legal-prose` CSS. */
export function LegalSubsection({ title, children }: LegalSubsectionProps) {
  return (
    <>
      <h3>{title}</h3>
      {children}
    </>
  );
}
