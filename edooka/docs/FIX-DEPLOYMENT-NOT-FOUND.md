# Permanent fix: Vercel `DEPLOYMENT_NOT_FOUND`

`404 DEPLOYMENT_NOT_FOUND` means the URL has **no active deployment** behind it (deleted project, failed build, wrong root directory, or domain pointing at the wrong Vercel project). It is **not** a bug inside the Next.js pages.

## One-time Vercel setup (do this once)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import **Beverse-edooka/Edooka**.
2. **Root Directory** must be **`edooka`** (Settings → General). Do **not** leave it empty.
3. There is **no** `vercel.json` at the repo root anymore (a bad root config with `outputDirectory: edooka/.next` broke Next.js deploys). Only `edooka/vercel.json` is used.
4. **Framework:** Next.js (auto-detected when root is `edooka`).
4. Add env vars (see `docs/DEPLOY-VERCEL.md`), especially `DATABASE_URL` and `NEXT_PUBLIC_APP_URL=https://edooka.in`.
5. Click **Deploy** and wait until status is **Ready**.

## Domain (edooka.in)

1. **Settings → Domains** → add `edooka.in` and `www.edooka.in` on **this** project only.
2. At your registrar, use the DNS records Vercel shows.
3. Remove `edooka.in` from any **old** or **deleted** Vercel projects.
4. After DNS propagates, **Redeploy** Production.

## Verify it works

| URL | Expected |
|-----|----------|
| `https://<your-project>.vercel.app/api/health` | `{"ok":true,"service":"edooka",...}` |
| `https://edooka.in/api/health` | Same JSON (after domain is linked) |

If `/api/health` works on `*.vercel.app` but not on `edooka.in`, the domain is still pointed at a dead deployment — fix **Domains**, not the app code.

## Every code update (ongoing)

```bash
git add .
git commit -m "your message"
git push origin main
```

Vercel redeploys `main` automatically. Open **Deployments** → latest **Production** → **Visit**. Do not bookmark old preview URLs; they expire and show `DEPLOYMENT_NOT_FOUND`.

## If build fails

Open the failed deployment → **Building** logs. Common fixes:

- `DATABASE_URL` missing → add Neon pooled URL in env vars.
- Wrong root → set Root Directory to `edooka` **or** use repo-root `vercel.json`.
- Node version → project uses Node 20+ (`package.json` engines).
