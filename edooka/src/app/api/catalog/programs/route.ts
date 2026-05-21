import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";
import { mapDbProgramToCard } from "@/lib/catalog-map";

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
    return NextResponse.json({ programs: [], source: "postgres" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database unavailable";
    return NextResponse.json(
      { programs: [], source: "postgres", error: message },
      { status: 503 }
    );
  }
}
