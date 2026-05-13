/**
 * Script: seed
 * Purpose: Inserts catalog programs (matches `src/data/programs.ts` slugs).
 */
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";

async function main() {
  await db.insert(programs).values([
    {
      slug: "diagnostic-lab",
      title: "Diagnostic Lab Operations",
      description: "Quality systems, workflow, and safety essentials for pathology and diagnostic laboratory professionals.",
      category: "Diagnostics",
      iconName: "flask-2",
    },
    {
      slug: "nursing-admin",
      title: "Nursing Administration",
      description: "Leadership, ward coordination, and documentation standards for nursing administrators.",
      category: "Clinical",
      iconName: "heart-pulse",
    },
    {
      slug: "physiotherapy",
      title: "Physiotherapy Leadership",
      description: "Clinic operations, patient pathways, and team leadership for physiotherapy practice heads.",
      category: "Clinical",
      iconName: "activity",
    },
    {
      slug: "radiology",
      title: "Radiology Workflow Essentials",
      description: "Imaging workflow, safety culture, and interdisciplinary coordination in radiology settings.",
      category: "Diagnostics",
      iconName: "scan",
    },
    {
      slug: "healthcare-sales",
      title: "Healthcare Sales Foundations",
      description: "Ethical selling, stakeholder alignment, and trust-building in healthcare commercial roles.",
      category: "Clinical",
      iconName: "handshake",
    },
    {
      slug: "ward-docs",
      title: "Ward Documentation Excellence",
      description: "Structured documentation, handoffs, and audit readiness for ward-level clinical teams.",
      category: "Clinical",
      iconName: "file-text",
    },
  ]);

  process.stdout.write("Seed complete\n");
}

main().catch((error) => {
  process.stderr.write(`Seed failed: ${String(error)}\n`);
  process.exit(1);
});
