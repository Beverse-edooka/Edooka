# Railway deploy — read this first

Your Next.js app is in the **`edooka/`** folder, not the repo root.

## Option A — GitHub (recommended)

1. Push code to **https://github.com/Beverse-edooka/Edooka** (branch `main`).
2. Railway → **New Project** → **Deploy from GitHub repo** → select **Edooka**.
3. Open the **web service** → **Settings**:
   - **Root Directory**: `edooka` ← **required if build fails**
   - **Watch Paths**: leave default or add `edooka/**`
4. **Variables** → add `DATABASE_URL` (from Postgres), `NEXT_PUBLIC_APP_URL`, Gmail, Cashfree, admin vars.
5. **Networking** → **Generate Domain**.
6. Click **Deploy** (or push to GitHub to trigger).

If deploy fails with “no build script” or “next not found”, you forgot **Root Directory = `edooka`**.

## Option B — Railway CLI (upload from PC)

```bash
npm i -g @railway/cli
railway login
cd edooka
railway link
railway up
```

Run `railway up` from **`edooka/`**, not the parent folder.

## After first successful deploy

```bash
cd edooka
railway run npm run db:setup
```

## Custom domain (edooka.in)

Service → **Settings** → **Networking** → **Custom Domain** → add DNS at your registrar → set `NEXT_PUBLIC_APP_URL=https://edooka.in` → **Redeploy**.

See `edooka/docs/DEPLOY-RAILWAY.md` for full detail.
