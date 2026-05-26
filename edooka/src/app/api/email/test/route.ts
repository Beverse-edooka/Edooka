import { NextRequest, NextResponse } from "next/server";
import { cleanEnv } from "@/lib/env-clean";
import { isGmailConfigured, sendMail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * GET /api/email/test?to=you@example.com
 * Sends a tiny diagnostic mail. Used to confirm GMAIL_USER + GMAIL_APP_PASSWORD work on Railway/Vercel.
 */
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to")?.trim();
  const user = cleanEnv(process.env.GMAIL_USER);
  const passLen = cleanEnv(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, "").length;

  if (!to || !to.includes("@")) {
    return NextResponse.json(
      {
        ok: false,
        error: "Append ?to=your@email.com to test SMTP delivery.",
        gmailUser: user || null,
        gmailPasswordLength: passLen,
        gmailConfigured: isGmailConfigured(),
      },
      { status: 400 }
    );
  }

  const result = await sendMail({
    to,
    subject: "Edooka SMTP test",
    html: `<p>This is a diagnostic email from your Edooka deployment.</p>
           <p>If you can read this, GMAIL_USER and GMAIL_APP_PASSWORD are set correctly.</p>`,
  });

  if ("error" in result) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        gmailUser: user || null,
        gmailPasswordLength: passLen,
        gmailConfigured: isGmailConfigured(),
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    ok: true,
    sentTo: to,
    gmailUser: user,
    gmailPasswordLength: passLen,
  });
}
