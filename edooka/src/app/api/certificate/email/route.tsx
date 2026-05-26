import { NextRequest, NextResponse } from "next/server";
import { verifyUrlForCertificate } from "@/lib/app-url";
import { getCertificateRenderInputFromDb } from "@/lib/certificate-from-db";
import { buildCertificateEmailHtml, sendMail } from "@/lib/email";
import { renderCertificatePng } from "@/lib/certificate-template";

export const runtime = "nodejs";

/**
 * POST /api/certificate/email — Gmail SMTP + template PNG attachment (no Resend / cloud).
 */
export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const certificateNumber = body.certificateNumber?.trim() ?? "EDK-PENDING";
  const fromDb = await getCertificateRenderInputFromDb(certificateNumber);

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

  let pngBuffer: Buffer;
  try {
    pngBuffer = await renderCertificatePng(
      fromDb ?? {
        fullName: recipientName,
        courseName: programTitle,
        certificateNumber,
        verifyUrl,
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Certificate render failed" },
      { status: 500 }
    );
  }

  const result = await sendMail({
    to: email,
    subject: `Your edooka certificate — ${programTitle}`,
    html,
    attachments: [
      {
        filename: `edooka-certificate-${certificateNumber}.png`,
        content: pngBuffer,
        contentType: "image/png",
      },
    ],
  });

  if ("error" in result) {
    console.error("[certificate/email] send failed:", result.error);
    return NextResponse.json(
      {
        skipped: true,
        error: result.error,
        message: result.error,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true });
}
