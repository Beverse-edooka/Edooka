# Deploy Edooka on Vercel (easiest) + Neon Postgres

Use this if Railway shows **"Problem processing request"** or your Railway DB trial expired.
The Next.js app runs on **Vercel**; the database runs on **Neon** (free tier, serverless-friendly).

## 1. Push code to GitHub

Repo: `https://github.com/Beverse-edooka/Edooka` (branch `main`).

## 2. Create Vercel project

1. Go to [vercel.com](https://vercel.com) → sign up (GitHub login usually works well here).
2. **Add New** → **Project** → import **Beverse-edooka/Edooka**.
3. **Root Directory** → click **Edit** → set to **`edooka`** → Continue.
4. Framework should auto-detect **Next.js**.

## 3. Create Neon database

1. Go to [neon.tech](https://neon.tech) → sign up → **New Project**.
2. Copy the **pooled** connection string (host contains `-pooler`), e.g.  
   `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
3. Do **not** use the direct (non-pooler) URL on Vercel — cold starts are slower.

## 4. Environment variables (before Deploy)

In Vercel → Project → **Settings** → **Environment Variables**, add:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon **pooled** connection string (from step 3) |
| `NEXT_PUBLIC_APP_URL` | `https://edooka.in` (or your `*.vercel.app` URL until DNS is ready) |
| `GMAIL_USER` | `anas.at@beversehealth.com` |
| `GMAIL_APP_PASSWORD` | Your Google app password (16 chars, no spaces) |
| `GMAIL_FROM` | `anas.at@beversehealth.com` |
| `NEXT_PUBLIC_CASHFREE_MODE` | `TEST` or `PRODUCTION` |
| `CASHFREE_APP_ID` | From Cashfree |
| `CASHFREE_SECRET_KEY` | From Cashfree |
| `CASHFREE_WEBHOOK_SECRET` | From Cashfree |
| `ADMIN_INITIAL_EMAIL` | Admin email |
| `ADMIN_INITIAL_PASSWORD` | Strong password |
| `ADMIN_SESSION_SECRET` | Long random string |

Apply to **Production**, **Preview**, and **Development**.

Click **Deploy**.

## 5. Initialize database (one time)

On your PC, put the Neon URL in `edooka/.env.local`:

```bash
DATABASE_URL=postgresql://....-pooler....neon.tech/neondb?sslmode=require
```

Then:

```bash
cd edooka
npm run db:setup
```

This creates tables and seeds programs/questions.

## 6. Custom domain edooka.in

1. Vercel → Project → **Settings** → **Domains**.
2. Add `edooka.in` and `www.edooka.in`.
3. At your domain registrar, add the DNS records Vercel shows (usually `A` + `CNAME`).
4. Set `NEXT_PUBLIC_APP_URL=https://edooka.in` in Vercel env vars.
5. **Redeploy** (Deployments → … → Redeploy).

## 7. Cashfree

Update return / webhook URLs to `https://edooka.in/...` (same as production URL).

## Reduce latency (Vercel + Neon)

1. **Same region** — create Neon in **US East (Ohio / Virginia)** if your Vercel app uses US.
2. Vercel → Project → **Settings** → **Functions** → **Function Region** → pick the region closest to your Neon host (e.g. `Washington, D.C.` for `us-east-1`).
3. Always use Neon **pooled** URL (`-pooler` in hostname).
4. After deploy, open `https://YOUR-DOMAIN/api/health/db` — should show `{ "ok": true, "programCount": 6 }` (or similar).

## Notes

- **Canvas** (`@napi-rs/canvas`) works on Vercel Node serverless for certificate PNG routes.
- If build fails on ESLint, fix reported files or set `eslint.ignoreDuringBuilds` in `next.config.ts` (only if needed).
- Neon **pooled** `DATABASE_URL` is required for Vercel serverless (see `src/lib/db/index.ts`).
- If connect fails, remove `channel_binding=require` from the URL and keep `sslmode=require`.
