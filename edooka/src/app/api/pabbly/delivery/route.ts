import { NextResponse } from "next/server";

/**
 * Route: GET /api/pabbly/delivery
 * Purpose: Placeholder endpoint for delivery queue polling.
 */
export async function GET() {
  return NextResponse.json({ pending: [] });
}
