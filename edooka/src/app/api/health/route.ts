import { NextResponse } from "next/server";

/** GET /api/health — lightweight liveness check for deploy verification. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "edooka",
    timestamp: new Date().toISOString(),
  });
}
