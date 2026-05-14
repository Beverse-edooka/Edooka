/**
 * Script: seed
 * Purpose: Inserts catalog programs (matches `src/data/programs.ts` slugs).
 * Uses INSERT…SELECT…WHERE NOT EXISTS so it works even if `slug` has no UNIQUE
 * index (some hosted DBs keep an older `programs` table shape).
 */
import "./load-local-env";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

const PROGRAM_ROWS = [
  {
    slug: "diagnostic-lab",
    title: "Diagnostic Lab Operations",
    description:
      "Quality systems, workflow, and safety essentials for pathology and diagnostic laboratory professionals.",
    category: "Diagnostics",
    iconName: "flask-2",
  },
  {
    slug: "nursing-admin",
    title: "Nursing Administration",
    description:
      "Leadership, ward coordination, and documentation standards for nursing administrators.",
    category: "Clinical",
    iconName: "heart-pulse",
  },
  {
    slug: "physiotherapy",
    title: "Physiotherapy Leadership",
    description:
      "Clinic operations, patient pathways, and team leadership for physiotherapy practice heads.",
    category: "Clinical",
    iconName: "activity",
  },
  {
    slug: "radiology",
    title: "Radiology Workflow Essentials",
    description:
      "Imaging workflow, safety culture, and interdisciplinary coordination in radiology settings.",
    category: "Diagnostics",
    iconName: "scan",
  },
  {
    slug: "healthcare-sales",
    title: "Healthcare Sales Foundations",
    description:
      "Ethical selling, stakeholder alignment, and trust-building in healthcare commercial roles.",
    category: "Clinical",
    iconName: "handshake",
  },
  {
    slug: "ward-docs",
    title: "Ward Documentation Excellence",
    description:
      "Structured documentation, handoffs, and audit readiness for ward-level clinical teams.",
    category: "Clinical",
    iconName: "file-text",
  },
] as const;

async function main() {
  for (const row of PROGRAM_ROWS) {
    await db.execute(sql`
      insert into programs (slug, title, description, category, icon_name)
      select ${row.slug}, ${row.title}, ${row.description}, ${row.category}, ${row.iconName}
      where not exists (select 1 from programs where slug = ${row.slug})
    `);
  }

  process.stdout.write("Seed complete\n");
}

main().catch((error: unknown) => {
  process.stderr.write(`Seed failed: ${String(error)}\n`);
  if (error && typeof error === "object" && "cause" in error && error.cause !== undefined) {
    process.stderr.write(`Cause: ${String((error as { cause: unknown }).cause)}\n`);
  }
  process.exit(1);
});
