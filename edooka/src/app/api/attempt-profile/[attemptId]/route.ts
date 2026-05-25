import { NextResponse } from "next/server";
import { getAttemptProfile } from "@/server/actions/attempt-profile";

export const runtime = "nodejs";

/**
 * GET /api/attempt-profile/[attemptId]
 * Returns the canonical learner profile (name, email, program) for an attempt
 * so the success page can recover it on devices where localStorage is missing.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await context.params;
  const result = await getAttemptProfile(decodeURIComponent(attemptId));
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
