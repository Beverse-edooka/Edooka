import { LegalPageShell } from "@/components/legal/LegalPageShell";
import TermsBody from "@/components/legal/TermsBody";

const META = [
  "Operating entity: Beverse Innovations Pvt. Ltd.",
  "Effective date: 22 May 2026",
  "Document version: v1.0",
];

export default function TermsConditions() {
  return (
    <LegalPageShell
      eyebrow="EDOOKA"
      title="TERMS AND CONDITIONS"
      subtitle="The legal agreement governing your use of edooka.in"
      meta={META}
    >
      <TermsBody />
    </LegalPageShell>
  );
}
