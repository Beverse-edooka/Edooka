/**
 * Script: seed
 * Purpose: Inserts initial launch programs into database.
 */
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";

async function main() {
  await db.insert(programs).values([
    {
      slug: "diagnostic-lab-operations",
      title: "Diagnostic Lab Operations Management",
      description: "Operations and quality systems for path labs",
      category: "diagnostics",
      iconName: "flask-2",
    },
    {
      slug: "nursing-administration",
      title: "Nursing Administration & Ward Management",
      description: "Ward management and clinical leadership",
      category: "clinical",
      iconName: "heart-pulse",
    },
    {
      slug: "physiotherapy-leadership",
      title: "Physiotherapy Clinic Leadership",
      description: "P&L, scaling, and patient retention",
      category: "clinical",
      iconName: "activity",
    },
  ]);

  process.stdout.write("Seed complete\n");
}

main().catch((error) => {
  process.stderr.write(`Seed failed: ${String(error)}\n`);
  process.exit(1);
});
