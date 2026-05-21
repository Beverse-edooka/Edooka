import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";

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
    const message = e instanceof Error ? e.message : "Database unavailable";
    return NextResponse.json(
      { assessmentCount: 0, source: "postgres", error: message },
      { status: 503 }
    );
  }
}
