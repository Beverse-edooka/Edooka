import { NextRequest, NextResponse } from "next/server";
import { verifyUrlForCertificate } from "@/lib/app-url";
import { getCertificateRenderInputFromDb } from "@/lib/certificate-from-db";
import { buildCertificateEmailHtml, sendMail } from "@/lib/email";
import { renderCertificatePng } from "@/lib/certificate-template";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/certificate/email — Gmail SMTP + template PNG attachment.
 *
 * The route NEVER throws: every branch returns JSON so the Railway edge
 * cannot reply with a 502. Render failures fall back to an attachment-less
 * email so the recipient still gets the certificate link + ID.
 */
export async function POST(req: NextRequest) {
  try {
    let body: {
      email?: string;
      recipientName?: string;
      programTitle?: string;
      certificateNumber?: string;
      issuedDateLabel?: string;
      verifyUrl?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ skipped: true, error: "Invalid JSON" }, { status: 200 });
    }

    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { skipped: true, error: "Valid email required" },
        { status: 200 },
      );
    }

    const certificateNumber = body.certificateNumber?.trim() ?? "EDK-PENDING";

    let fromDb: Awaited<ReturnType<typeof getCertificateRenderInputFromDb>> = null;
    try {
      fromDb = await getCertificateRenderInputFromDb(certificateNumber);
    } catch (e) {
      console.error("[certificate/email] DB lookup failed:", e);
    }

    const recipientName = fromDb?.fullName ?? body.recipientName?.trim() ?? "Learner";
    const programTitle = fromDb?.courseName ?? body.programTitle?.trim() ?? "Assessment";
    const verifyUrl =
      fromDb?.verifyUrl ??
      body.verifyUrl?.trim() ??
      verifyUrlForCertificate(fromDb?.certificateNumber ?? certificateNumber);

    const html = buildCertificateEmailHtml({
      fullName: recipientName,
      courseName: programTitle,
      certificateNumber: fromDb?.certificateNumber ?? certificateNumber,
      verifyUrl,
    });

    let pngBuffer: Buffer | null = null;
    let renderWarning: string | null = null;
    try {
      pngBuffer = await renderCertificatePng(
        fromDb ?? {
          fullName: recipientName,
          courseName: programTitle,
          certificateNumber,
          verifyUrl,
        },
      );
    } catch (e) {
      renderWarning = e instanceof Error ? e.message : "Certificate render failed";
      console.error("[certificate/email] render failed:", renderWarning);
    }

    const attachments = pngBuffer
      ? [
          {
            filename: `edooka-certificate-${certificateNumber}.png`,
            content: pngBuffer,
            contentType: "image/png",
          },
        ]
      : undefined;

    const result = await sendMail({
      to: email,
      subject: `Your edooka certificate — ${programTitle}`,
      html,
      attachments,
    });

    if ("error" in result) {
      console.error("[certificate/email] send failed:", result.error);
      return NextResponse.json(
        {
          skipped: true,
          error: result.error,
          message: result.error,
          renderWarning,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      attached: Boolean(pngBuffer),
      renderWarning,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error in email route";
    console.error("[certificate/email] unhandled:", e);
    return NextResponse.json(
      { skipped: true, error: message, message },
      { status: 200 },
    );
  }
}
