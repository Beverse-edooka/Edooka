import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";
import { PROGRAMS } from "@/data/programs";
import { mapDbProgramToCard } from "@/lib/catalog-map";
import { fileProgramsList, shouldUseAdminFileCatalog } from "@/lib/admin-catalog-file";

export const runtime = "nodejs";

/** Public program list for homepage, library, and assessments grids. */
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(programs)
      .where(eq(programs.isActive, true))
      .orderBy(asc(programs.title));
    if (rows.length > 0) {
      return NextResponse.json({
        programs: rows.map((r) => mapDbProgramToCard(r)),
        source: "postgres",
      });
    }
  } catch (e) {
    if (shouldUseAdminFileCatalog(e)) {
      const rows = fileProgramsList().filter((p) => p.isActive);
      if (rows.length > 0) {
        return NextResponse.json({
          programs: rows.map((r) => mapDbProgramToCard(r)),
          source: "file",
        });
      }
    }
  }

  return NextResponse.json({ programs: PROGRAMS, source: "static" });
}
