# Deploy edooka on Railway

## Required settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `edooka` |
| **Node version** | **20** (not 18) |

In Railway → your service → **Settings** → set **Root Directory** to `edooka`.

Add variable (if the build still uses Node 18):

```
NIXPACKS_NODE_VERSION=20
```

Optional (avoids `npm ci` lockfile errors):

```
NIXPACKS_INSTALL_CMD=npm install
```

## Why builds fail

### 1. `EBADENGINE` — Node 18

Logs show `current: { node: 'v18.20.5' }` but this app uses **Next.js 16**, which requires **Node ≥ 20.9**.

Railway/Nixpacks must use Node 20 (`engines` in `package.json`, `.nvmrc`, and `NIXPACKS_NODE_VERSION`).

### 2. `npm ci` — lock file out of sync

```
Missing: esbuild@0.28.0 from lock file
```

Usually caused by:

- Railway building the **repo root** (`Edooka/`) instead of **`edooka/`** (wrong `package-lock.json`).
- `package.json` changed without running `npm install` and committing `package-lock.json`.

**Fix:** set Root Directory to `edooka`, use `npm install` (not `npm ci`), or run locally:

```bash
cd edooka
npm install
git add package-lock.json
git commit -m "Sync package-lock.json"
git push
```

### 3. `npm warn config production`

Harmless. Railway runs install in production mode; devDependencies are still installed for the build.

## Recommended: use Vercel + Neon

This project is already tuned for **Vercel** (Next.js) and **Neon** (Postgres). Railway works if Root Directory and Node 20 are set correctly.

## Environment variables

Same as Vercel:

- `DATABASE_URL` — Neon connection string
- `NEXT_PUBLIC_APP_URL` — public site URL
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — optional, for certificate email

After deploy, run once against Neon:

```bash
cd edooka
npm run db:setup
```
