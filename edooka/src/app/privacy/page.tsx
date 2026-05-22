import { LegalPageShell } from "@/components/legal/LegalPageShell";
import PrivacyBody from "@/components/legal/PrivacyBody";

const META = [
  "Operating entity: Beverse Innovations Pvt. Ltd.",
  "Effective date: 22 May 2026",
  "Document version: v1.0",
];

export default function PrivacyPolicy() {
  return (
    <LegalPageShell
      eyebrow="EDOOKA"
      title="PRIVACY POLICY"
      subtitle="How Edooka collects, uses, and protects your personal data"
      meta={META}
    >
      <PrivacyBody />
    </LegalPageShell>
  );
}
