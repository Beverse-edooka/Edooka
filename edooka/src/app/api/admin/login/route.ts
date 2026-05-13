import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { COOKIE_NAME, createAdminToken } from "@/lib/admin-auth";

function safeCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

const DEV_ADMIN_EMAIL = "admin@edooka.com";
const DEV_ADMIN_PASSWORD = "admin@123";

export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const email = (process.env.ADMIN_INITIAL_EMAIL ?? (isProd ? "" : DEV_ADMIN_EMAIL)).trim();
  const password = process.env.ADMIN_INITIAL_PASSWORD ?? (isProd ? "" : DEV_ADMIN_PASSWORD);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Admin credentials are not configured. Set ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD." },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ok =
    safeCompare(body.email?.trim().toLowerCase() ?? "", email.trim().toLowerCase()) &&
    safeCompare(body.password ?? "", password);

  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
