import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";
import { PROGRAMS } from "@/data/programs";
import { fileProgramsList, shouldUseAdminFileCatalog } from "@/lib/admin-catalog-file";

export const runtime = "nodejs";

/** Public count of active assessments/libraries for homepage stats. */
export async function GET() {
  try {
    const rows = await db
      .select({ id: programs.id })
      .from(programs)
      .where(eq(programs.isActive, true));
    return NextResponse.json({ assessmentCount: rows.length });
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      const count = fileProgramsList().filter((p) => p.isActive).length;
      return NextResponse.json({ assessmentCount: count, source: "file" });
    }
    return NextResponse.json({ assessmentCount: PROGRAMS.length, source: "static" });
  }
}
