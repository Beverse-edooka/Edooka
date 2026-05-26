import nodemailer from "nodemailer";
import { cleanEnv, gmailConfigHint } from "@/lib/env-clean";

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

/** Gmail App Passwords are 16 chars; users often paste them with spaces. Strip all whitespace. */
function cleanGmailPassword(value?: string): string {
  return cleanEnv(value).replace(/\s+/g, "");
}

export function isGmailConfigured(): boolean {
  const user = cleanEnv(process.env.GMAIL_USER);
  const pass = cleanGmailPassword(process.env.GMAIL_APP_PASSWORD);
  return Boolean(user && pass);
}

/** SMTP transport. Tries SSL 465 first; STARTTLS 587 is used as fallback in sendMail. */
function buildTransport(port: 465 | 587) {
  const user = cleanEnv(process.env.GMAIL_USER);
  const pass = cleanGmailPassword(process.env.GMAIL_APP_PASSWORD);
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { servername: "smtp.gmail.com" },
  });
}

export function getMailTransport() {
  return buildTransport(465);
}

function explainSmtpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("username and password not accepted")) {
    return `${message} — Gmail rejected the credentials. Re-create an App Password at https://myaccount.google.com/apppasswords (2-Step Verification must be ON), and make sure GMAIL_USER matches the account that generated the password.`;
  }
  if (m.includes("eauth") || m.includes("application-specific")) {
    return `${message} — Google requires an App Password (not your normal Gmail password). Generate one and update GMAIL_APP_PASSWORD.`;
  }
  if (m.includes("self-signed") || m.includes("certificate") || m.includes("etimedout") || m.includes("econnrefused")) {
    return `${message} — SMTP connection problem. Check Railway egress isn't blocked, and that GMAIL_USER/GMAIL_APP_PASSWORD have no extra characters.`;
  }
  return message;
}

export async function sendMail(opts: SendMailOptions): Promise<{ ok: true } | { error: string }> {
  if (!isGmailConfigured()) {
    return { error: gmailConfigHint() };
  }

  const from =
    cleanEnv(process.env.GMAIL_FROM) ||
    cleanEnv(process.env.GMAIL_USER) ||
    "certificates@edooka.in";

  const payload = {
    from: `Edooka <${from}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType ?? "application/octet-stream",
    })),
  };

  const ports: Array<465 | 587> = [465, 587];
  let lastError = "Could not send email";
  for (const port of ports) {
    const transport = buildTransport(port);
    if (!transport) continue;
    try {
      await transport.sendMail(payload);
      return { ok: true };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      lastError = explainSmtpError(raw);
      console.error(`[email] Gmail SMTP failed on port ${port}:`, raw);
    }
  }

  return { error: lastError };
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
