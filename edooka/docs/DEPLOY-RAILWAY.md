# Deploy Edooka on Railway (app + PostgreSQL)

This app lives in the **`edooka/`** folder. If your Git repo root is `Edooka/`, set **Root Directory** to `edooka` on the Railway service.

## 1. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project**.
2. **Deploy from GitHub repo** and select this repository.
3. On the web service → **Settings** → **Root Directory** → `edooka` (if repo root is parent folder).
4. **Settings** → **Networking** → **Generate Domain** (e.g. `edooka-production.up.railway.app`).

## 2. Add PostgreSQL

1. In the same project → **+ New** → **Database** → **PostgreSQL**.
2. Open the Postgres service → **Connect** → copy **`DATABASE_URL`** (private network URL is fine for the app service in the same project).

## 3. Link database to the app

On the **Edooka web service** → **Variables**:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (use Railway variable reference) |
| `NEXT_PUBLIC_APP_URL` | Your public URL, e.g. `https://edooka-production.up.railway.app` (no trailing slash) |
| `NEXT_PUBLIC_CASHFREE_MODE` | `PRODUCTION` when live |
| `CASHFREE_APP_ID` | From Cashfree dashboard |
| `CASHFREE_SECRET_KEY` | From Cashfree dashboard |
| `CASHFREE_WEBHOOK_SECRET` | From Cashfree dashboard |
| `ADMIN_INITIAL_EMAIL` | Admin login email |
| `ADMIN_INITIAL_PASSWORD` | Strong password |
| `ADMIN_SESSION_SECRET` | Long random string (32+ chars) |

Optional (certificate email):

| Variable | Value |
|----------|--------|
| `GMAIL_USER` | Gmail address |
| `GMAIL_APP_PASSWORD` | Google App Password |
| `GMAIL_FROM` | Same as `GMAIL_USER` |

`NEXT_PUBLIC_APP_URL` must be set **before build** so QR codes and verify links use your production domain.

## 4. Initialize the database (one time)

After the first deploy, run schema + seed against Railway Postgres.

**Option A — Railway CLI (recommended)**

```bash
npm i -g @railway/cli
railway login
cd edooka
railway link          # pick your project + web service
railway run npm run db:setup
```

`db:setup` runs `drizzle-kit push` (creates/updates tables from schema) then `tsx scripts/seed.ts`.

**Option B — Apply SQL migration manually**

If you prefer the hand-written migration:

```bash
railway run psql $DATABASE_URL -f src/lib/db/migrations/0001_certificate_qr_token.sql
railway run npm run seed
```

**Option C — Local with Railway URL**

```bash
cd edooka
# Paste DATABASE_URL from Railway Postgres → Variables (public URL if running locally)
set DATABASE_URL=postgresql://...
npm run db:setup
```

## 5. Redeploy

Push to GitHub or click **Deploy** in Railway. Build command: `npm ci && npm run build` (see `railway.toml`). Start: `npm run start`.

## 6. Cashfree webhooks (production)

In Cashfree dashboard, set webhook / return URLs to:

- Return: `https://YOUR_DOMAIN/success/...` (already built in app)
- Webhook: your Cashfree webhook route if configured in the app

Use the same host as `NEXT_PUBLIC_APP_URL`.

## 7. Connect your custom domain (e.g. edooka.in)

1. Railway → your **web service** → **Settings** → **Networking** → **Custom Domain**.
2. Add:
   - `edooka.in` (apex / root)
   - `www.edooka.in` (optional)
3. Railway shows **DNS records** to add at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
   - Usually a **CNAME** for `www` → something like `xxxx.up.railway.app`
   - For apex `@`, Railway may give a **CNAME** (if your registrar supports CNAME flattening) or **A/ALIAS** records — copy exactly what Railway shows.
4. Wait for DNS to propagate (often 5–30 minutes; up to 48h).
5. In Railway **Variables**, set:
   ```text
   NEXT_PUBLIC_APP_URL=https://edooka.in
   ```
   (Use `https://www.edooka.in` only if that is your canonical URL; pick one and stick to it.)
6. **Redeploy** the web service so the build picks up `NEXT_PUBLIC_APP_URL` (required for QR codes and verify links).
7. In **Cashfree** dashboard, update return URLs and webhooks to use `https://edooka.in`.

**Cloudflare tip:** If you use Cloudflare proxy (orange cloud), set SSL mode to **Full** and enable HTTPS on Railway; otherwise use DNS-only (grey cloud) first to verify.

## 8. Verify deployment

1. Open `https://YOUR_DOMAIN` — home page loads.
2. Complete a test assessment → pay (or demo) → success page should **not** show “Could not register certificate”.
3. Open `https://YOUR_DOMAIN/verify` and enter the certificate number from the PDF.
4. Scan the QR on the certificate — should open `/verify/<token>`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Could not register certificate` / purchase insert failed | Ensure `npm run db:setup` ran; attempt row must exist before purchase (fixed in latest `issue` route). |
| Verify always “not found” | Certificate row missing — retry success page after DB is set up; check Railway logs for `[certificate/issue]`. |
| QR opens localhost | Set `NEXT_PUBLIC_APP_URL` to production URL and **redeploy** (rebuild). |
| Build fails on canvas | `serverExternalPackages` for `@napi-rs/canvas` is already in `next.config.ts`. |
| DB connection timeout | Use Railway’s internal `DATABASE_URL` between services in the same project. |

## Migrating from Neon / Supabase

1. Export data (optional): `pg_dump` from old host.
2. Create Railway Postgres (step 2).
3. Run `npm run db:setup` on Railway (step 4).
4. Point `DATABASE_URL` at Railway only in production variables.
5. Remove old DB URL from Vercel/other hosts if you were deployed elsewhere.
