import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs } from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * GET /api/health/db — quick Neon/Postgres connectivity check (production debugging).
 */
export async function GET() {
  const hasUrl = Boolean(process.env.DATABASE_URL?.trim());
  if (!hasUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not set on this deployment (add it in Vercel → Environment Variables, then redeploy).",
      },
      { status: 503 },
    );
  }

  try {
    await db.execute(sql`select 1`);
    const rows = await db.select({ n: sql<number>`cast(count(*) as int)` }).from(programs);
    const programCount = rows[0]?.n ?? 0;

    return NextResponse.json({
      ok: true,
      programCount,
      hint:
        programCount === 0
          ? "Connected but empty — run `npm run db:setup` locally with the same DATABASE_URL."
          : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const isMissingProgramsTable =
      message.toLowerCase().includes('relation "programs" does not exist') ||
      message.toLowerCase().includes("relation 'programs' does not exist") ||
      message.toLowerCase().includes('from "programs"');

    return NextResponse.json(
      {
        ok: false,
        error: message,
        hints: isMissingProgramsTable
          ? [
              "DB connected, but schema/tables are missing in this database.",
              "Run `railway run npm run db:setup` from the edooka folder.",
              "If the command succeeds, redeploy the web service and recheck /api/health/db.",
              "Verify DATABASE_URL points to the same Railway Postgres service used by the web app.",
            ]
          : [
              "DATABASE_URL may point to a DB without the app schema.",
              "Run `railway run npm run db:setup` from the edooka folder.",
              "If using Railway Postgres, use the service reference `${{Postgres.DATABASE_URL}}`.",
              "Redeploy after updating environment variables.",
            ],
      },
      { status: 503 },
    );
  }
}
