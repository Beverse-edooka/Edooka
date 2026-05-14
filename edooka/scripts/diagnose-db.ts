/**
 * Quick check: can this machine resolve DATABASE_URL host and reach port 5432?
 * Run: npm run db:diag
 */
import "./load-local-env";
import dns from "node:dns/promises";
import net from "node:net";
import { rewriteSupabaseDbUrlIfNeeded } from "../src/lib/db/rewrite-supabase-url";

function maskDatabaseUrl(raw: string): string {
  try {
    const u = new URL(raw.replace(/^postgres(ql)?:\/\//i, "http://"));
    const proto = raw.startsWith("postgresql://") ? "postgresql://" : "postgres://";
    const user = u.username ? `${encodeURIComponent(u.username)}:***` : "";
    const auth = user ? `${user}@` : "";
    return `${proto}${auth}${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}${u.search}`;
  } catch {
    return "(could not parse DATABASE_URL)";
  }
}

function parseHostPort(raw: string): { host: string; port: number } | null {
  try {
    const u = new URL(raw.replace(/^postgres(ql)?:\/\//i, "http://"));
    const port = u.port ? Number(u.port) : 5432;
    if (!u.hostname) return null;
    return { host: u.hostname, port: Number.isFinite(port) ? port : 5432 };
  } catch {
    return null;
  }
}

async function main() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    console.error("DATABASE_URL is missing in .env.local");
    process.exit(1);
  }
  console.log("Using:", maskDatabaseUrl(raw));

  const rewritten = rewriteSupabaseDbUrlIfNeeded(raw);
  if (rewritten !== raw) {
    console.log("Effective (Supabase DNS workaround):", maskDatabaseUrl(rewritten));
  }

  const hp = parseHostPort(rewritten);
  if (!hp) {
    console.error("Could not parse host from DATABASE_URL.");
    process.exit(1);
  }

  console.log(`\n1) DNS lookup: ${hp.host}`);
  try {
    const results = await dns.lookup(hp.host, { all: true });
    for (const r of results) {
      console.log(`   → ${r.address} (${r.family === 4 ? "IPv4" : "IPv6"})`);
    }
    const hasV4 = results.some((r) => r.family === 4);
    const hasV6 = results.some((r) => r.family === 6);
    if (!hasV4 && hasV6) {
      console.warn(`
   WARNING: Only IPv6 addresses found. Some Windows / office networks cannot reach IPv6-only hosts.
   Fix: Supabase Dashboard → Database → use "Session pooler" or "Transaction" connection string
   (host like *.pooler.supabase.com, often port 6543) — those usually include IPv4.
   Or enable Supabase "IPv4 add-on" for direct connections.`);
    }
  } catch (e) {
    console.error(`   FAILED: ${String(e)}`);
    console.error(`
   ENOTFOUND usually means:
   • Wrong hostname — copy the exact "URI" from Supabase → Project Settings → Database
     (direct: db.<ref>.supabase.co, or use the pooler host if Supabase shows one).
   • Project deleted / ref typo — ref must match your live project.
   • DNS/VPN — try another network, disable VPN, or run: ipconfig /flushdns (Windows).
   • Supabase "IPv4 add-on" — some networks need the paid IPv4 option for direct connections.
`);
    process.exit(1);
  }

  console.log(`\n2) TCP ${hp.host}:${hp.port} (5s timeout)`);
  await new Promise<void>((resolve, reject) => {
    const s = net.connect({ host: hp.host, port: hp.port, timeout: 5000 }, () => {
      console.log("   OK — port is reachable");
      s.end();
      resolve();
    });
    s.on("error", (err) => {
      console.error(`   FAILED: ${err.message}`);
      console.error("   Firewall or ISP may block outbound 5432; try pooler (port 6543) from Supabase.");
      reject(err);
    });
    s.on("timeout", () => {
      s.destroy();
      reject(new Error("timeout"));
    });
  }).catch(() => process.exit(1));

  console.log("\nIf both steps pass, run: npm run db:push && npm run seed\n");
}

main();
