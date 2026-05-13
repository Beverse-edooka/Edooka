import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth";

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
