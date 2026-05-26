/** Normalize env values pasted from Railway/Vercel (quotes, trailing commas, whitespace). */
export function cleanEnv(value?: string): string {
  if (!value) return "";
  let out = value.trim();
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1).trim();
  }
  out = out.replace(/,+$/, "").trim();
  return out;
}

export function gmailConfigHint(): string {
  return "Set GMAIL_USER and GMAIL_APP_PASSWORD in your hosting dashboard (Vercel → Settings → Environment Variables, or Railway → Variables). Use a Gmail App Password, not your normal password.";
}
