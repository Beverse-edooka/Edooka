import nodemailer from "nodemailer";

export type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
};

/** Gmail SMTP via app password — no Resend subscription required. */
export function getMailTransport() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export async function sendMail(opts: SendMailOptions): Promise<{ ok: true } | { error: string }> {
  const transport = getMailTransport();
  if (!transport) {
    return { error: "GMAIL_USER and GMAIL_APP_PASSWORD are not configured" };
  }

  const from =
    process.env.GMAIL_FROM?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    "certificates@edooka.in";

  try {
    await transport.sendMail({
      from: `Edooka <${from}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType ?? "application/pdf",
      })),
    });
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to send email" };
  }
}

export function buildCertificateEmailHtml(params: {
  fullName: string;
  courseName: string;
  certificateNumber: string;
  verifyUrl: string;
}): string {
  const { fullName, courseName, certificateNumber, verifyUrl } = params;
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, 'Times New Roman', serif; color: #18181b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px;">
  <p>Dear ${escapeHtml(fullName)},</p>
  <p>Congratulations on successfully completing the <strong>${escapeHtml(courseName)} Skill Assessment</strong> with edooka.</p>
  <p>We are delighted to recognize your dedication, professional knowledge, and commitment to continuous learning. Your achievement reflects your effort and excellence in the healthcare and professional skill domain.</p>
  <p style="margin: 24px 0; padding: 16px; background: #fff5ef; border-radius: 12px; border: 1px solid #eaeae6;">
    <strong>Certificate ID:</strong> ${escapeHtml(certificateNumber)}<br />
    <a href="${escapeHtml(verifyUrl)}" style="color: #ff6b35;">Verify online</a>
  </p>
  <p style="text-align: center;">
    <img src="${qrImg}" alt="Scan to verify" width="120" height="120" style="border: 1px solid #eaeae6; border-radius: 8px;" />
  </p>
  <p>Your certificate PDF is attached to this email.</p>
  <p>If you have any questions or need assistance, feel free to contact our support team.</p>
  <p>Warm regards,<br />
  <strong>Brinchu Kunjumon</strong><br />
  CEO &amp; Founder<br />
  Edooka<br />
  <em>Empowering Professionals Through Verified Skills.</em></p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
