const COOKIE_NAME = "edooka_admin_token";

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.ADMIN_INITIAL_PASSWORD ??
    "dev-only-change-me"
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createAdminToken(): Promise<string> {
  const payload = JSON.stringify({
    v: 1,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const b64 = toBase64Url(new TextEncoder().encode(payload));
  const mac = await hmacSha256(getSecret(), b64);
  const sig = toBase64Url(mac);
  return `${b64}.${sig}`;
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  const mac = await hmacSha256(getSecret(), b64);
  const expected = toBase64Url(mac);
  if (!timingSafeEqual(sig, expected)) return false;
  try {
    const raw = new TextDecoder().decode(fromBase64Url(b64));
    const data = JSON.parse(raw) as { exp?: number };
    if (typeof data.exp !== "number" || Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
