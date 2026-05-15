import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import { CertificateDocument } from "@/components/pdf/CertificateDocument";
import { verifyUrlForCertificate } from "@/lib/app-url";

export const runtime = "nodejs";

/**
 * POST /api/certificate/email
 * Sends the PDF certificate to the learner after successful payment (Resend).
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "certificates@edooka.in";

  let body: {
    email?: string;
    recipientName?: string;
    programTitle?: string;
    certificateNumber?: string;
    issuedDateLabel?: string;
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

  const recipientName = body.recipientName?.trim() ?? "Learner";
  const programTitle = body.programTitle?.trim() ?? "Assessment";
  const certificateNumber = body.certificateNumber?.trim() ?? "EDK-PENDING";
  const issuedDateLabel =
    body.issuedDateLabel ??
    new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  const verifyUrl = verifyUrlForCertificate(certificateNumber);

  const pdfBuffer = await renderToBuffer(
    <CertificateDocument
      recipientName={recipientName}
      programTitle={programTitle}
      certificateNumber={certificateNumber}
      issuedDateLabel={issuedDateLabel}
      verifyUrl={verifyUrl}
    />
  );

  if (!apiKey) {
    return NextResponse.json(
      {
        skipped: true,
        message: "RESEND_API_KEY not configured; PDF generated but email not sent.",
      },
      { status: 200 }
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `Your edooka certificate — ${programTitle}`,
    html: `<p>Hi ${recipientName},</p><p>Congratulations on earning your certificate. Your PDF is attached.</p><p>Certificate number: <strong>${certificateNumber}</strong></p>`,
    attachments: [
      {
        filename: `edooka-certificate-${certificateNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
