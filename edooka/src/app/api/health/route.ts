import { NextResponse } from "next/server";
import { isGmailConfigured } from "@/lib/email";
import { getAppOrigin } from "@/lib/app-url";

/** GET /api/health — lightweight liveness check for deploy verification. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "edooka",
    appOrigin: getAppOrigin(),
    gmailConfigured: isGmailConfigured(),
    timestamp: new Date().toISOString(),
  });
}
