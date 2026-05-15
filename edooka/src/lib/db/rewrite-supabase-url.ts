import * as dns from "node:dns";

/** @types/node omits some sync APIs; they exist at runtime in Node. */
type DnsNodeSync = typeof dns & {
  lookupSync(hostname: string, family?: number): string;
  resolve6Sync(hostname: string): string[];
  resolve4Sync(hostname: string): string[];
};

const dnsSync = dns as DnsNodeSync;

const DIRECT_DB_HOST = /^db\.[^.]+\.supabase\.co$/i;

/**
 * Supabase direct host `db.<ref>.supabase.co` is often IPv6-only (AAAA). Some Windows
 * stacks return ENOTFOUND from getaddrinfo. Resolve AAAA/A explicitly and rewrite the
 * host to a literal address so `postgres` / Drizzle can connect.
 */
export function rewriteSupabaseDbUrlIfNeeded(urlStr: string): string {
  const raw = urlStr.trim();
  if (!raw) return urlStr;

  if (typeof dnsSync.lookupSync !== "function" || typeof dnsSync.resolve6Sync !== "function") {
    return urlStr;
  }

  const proto = raw.startsWith("postgresql://") ? "postgresql://" : "postgres://";

  let u: URL;
  try {
    u = new URL(raw.replace(/^postgres(ql)?:\/\//i, "http://"));
  } catch {
    return urlStr;
  }

  const host = u.hostname;
  if (!DIRECT_DB_HOST.test(host)) {
    return urlStr;
  }

  try {
    dnsSync.lookupSync(host);
    return urlStr;
  } catch {
    /* try IPv6-only getaddrinfo path, then DNS AAAA/A */
  }

  try {
    const addr = dnsSync.lookupSync(host, 6) as string;
    if (addr?.includes(":")) {
      u.hostname = addr;
      return u.href.replace(/^https?:\/\//, proto);
    }
  } catch {
    /* */
  }

  try {
    const v6 = dnsSync.resolve6Sync(host);
    if (v6[0]) {
      u.hostname = v6[0];
      return u.href.replace(/^https?:\/\//, proto);
    }
  } catch {
    /* no AAAA */
  }

  try {
    const v4 = dnsSync.resolve4Sync(host);
    if (v4[0]) {
      u.hostname = v4[0];
      return u.href.replace(/^https?:\/\//, proto);
    }
  } catch {
    /* no A */
  }

  return urlStr;
}
