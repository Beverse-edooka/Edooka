import { LegalPageShell } from "@/components/legal/LegalPageShell";
import RefundBody from "@/components/legal/RefundBody";

const META = [
  "Operating entity: Beverse Innovations Pvt. Ltd.",
  "Effective date: 22 May 2026",
  "Document version: v1.0",
];

export default function RefundPolicy() {
  return (
    <LegalPageShell
      eyebrow="EDOOKA"
      title="REFUND POLICY"
      subtitle="Refund eligibility, process, and timelines"
      meta={META}
    >
      <RefundBody />
    </LegalPageShell>
  );
}
