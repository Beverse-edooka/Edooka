# API quick tests (live)

Run these against your **production** base URL (replace the domain if you use a custom host).

**Prerequisites**

- `DATABASE_URL` set on Vercel (Neon)
- `NEXT_PUBLIC_APP_URL` = your live origin (not `http://localhost:3000`)
- Tables migrated: `npm run db:push` (or `npm run db:setup`) against Neon
- Optional: `GMAIL_USER` + `GMAIL_APP_PASSWORD` for certificate email tests

---

## PowerShell (Windows)

```powershell
$BASE = "https://edooka.vercel.app"   # or https://edooka.in

# --- Health ---
Invoke-RestMethod "$BASE/api/health/db"

# --- Catalog (expect source: postgres when DB is wired) ---
Invoke-RestMethod "$BASE/api/catalog/programs"

# --- Referral: init wallet ---
$init = Invoke-RestMethod "$BASE/api/referral/init" -Method POST -ContentType "application/json" -Body '{}'
$code = $init.referralCode
Write-Host "Referral code: $code"

# --- Coins balance ---
Invoke-RestMethod "$BASE/api/referral/coins?referralCode=$code"

# --- Award coins (idempotent: run twice; balance should not double) ---
$awardBody = @{
  referralCode  = $code
  referredEmail = "friend@example.com"
  trigger       = "payment"
  purchaseId    = "test-order-001"
} | ConvertTo-Json
Invoke-RestMethod "$BASE/api/referral/award" -Method POST -ContentType "application/json" -Body $awardBody
Invoke-RestMethod "$BASE/api/referral/award" -Method POST -ContentType "application/json" -Body $awardBody

# --- Spend 5 coins (same as checkout "Redeem 5 coins") ---
$spendBody = @{
  referralCode = $code
  attemptId    = "test-attempt-001"
  coins        = 5
} | ConvertTo-Json
Invoke-RestMethod "$BASE/api/referral/spend" -Method POST -ContentType "application/json" -Body $spendBody

# --- Coins after spend ---
Invoke-RestMethod "$BASE/api/referral/coins?referralCode=$code"
```

---

## curl (bash / Git Bash)

```bash
BASE="https://edooka.vercel.app"

curl -s "$BASE/api/health/db" | jq .

curl -s "$BASE/api/catalog/programs" | jq .

CODE=$(curl -s -X POST "$BASE/api/referral/init" \
  -H "Content-Type: application/json" -d '{}' | jq -r .referralCode)
echo "Referral code: $CODE"

curl -s "$BASE/api/referral/coins?referralCode=$CODE" | jq .

curl -s -X POST "$BASE/api/referral/award" \
  -H "Content-Type: application/json" \
  -d "{\"referralCode\":\"$CODE\",\"referredEmail\":\"friend@example.com\",\"trigger\":\"payment\",\"purchaseId\":\"test-order-001\"}" | jq .

curl -s -X POST "$BASE/api/referral/spend" \
  -H "Content-Type: application/json" \
  -d "{\"referralCode\":\"$CODE\",\"attemptId\":\"test-attempt-001\",\"coins\":5}" | jq .

curl -s "$BASE/api/referral/coins?referralCode=$CODE" | jq .
```

---

## Certificate (register in DB, then PNG)

**404 on `/api/certificate/png/...`** means the certificate number is **not in Postgres yet**. The PNG route only serves certs that were registered via `POST /api/certificate/issue`. Use the app download button (it registers first) or run the steps below.

**Blank template PNG** (no name/course/ID) = missing fonts on server — redeploy latest `main` (DejaVu fonts in `public/fonts`).

### 1) Check if cert exists

```powershell
$BASE = "https://edooka.vercel.app"
$cert = "EDK-2026-9D9E379F"   # your cert number from the success page
Invoke-RestMethod "$BASE/api/verify/$cert"
```

If `valid` is `false`, register it (step 2).

### 2) Register certificate (required before PNG GET)

```powershell
$issueBody = @{
  attemptId         = "PASTE-YOUR-ATTEMPT-UUID"   # from browser URL ?attemptId=
  orderId           = "wallet-PASTE-ATTEMPT-UUID" # or your Cashfree order id
  bundleKey         = "single"
  slug              = "diagnostic-lab"            # program slug you took
  certificateNumber = $cert
  name              = "Your Name"
  email             = "you@example.com"           # optional; synthetic email used if empty
  phone             = "9999999999"
} | ConvertTo-Json

Invoke-RestMethod "$BASE/api/certificate/issue" -Method POST -ContentType "application/json" -Body $issueBody
```

### 3) Download PNG

```powershell
Invoke-WebRequest "$BASE/api/certificate/png/$cert" -OutFile "certificate-test.png"
```

Or render without DB (POST):

```powershell
$renderBody = @{
  fullName          = "Your Name"
  courseName        = "Diagnostic Lab Operations"
  certificateNumber = $cert
  verifyUrl         = "$BASE/verify/$cert"
} | ConvertTo-Json
Invoke-WebRequest "$BASE/api/certificate/render" -Method POST -ContentType "application/json" -Body $renderBody -OutFile "certificate-render.png"
```

Verify by number or QR token:

```
GET {BASE}/api/verify/{certNumberOrQrToken}
```

---

## UI flows that hit these APIs

| Action | API |
|--------|-----|
| Checkout → Redeem 5 coins | `POST /api/referral/spend` |
| Payment success | `POST /api/certificate/issue`, then `POST /api/certificate/email` |
| Download certificate | `GET /api/certificate/png/{certNumber}` |
| Payment success referral award | `POST /api/referral/award` (`trigger: payment`) |
| Certificate download referral award | `POST /api/referral/award` (`trigger: certificate_download`) |

---

## Expected referral responses

**Award (success)** — `{ "ok": true, "coins": <number> }`  
**Award (duplicate)** — still `ok`; coins unchanged.

**Spend (success)** — `{ "ok": true, "coins": <remaining> }`  
**Spend (already spent for attempt)** — `400`, `reason: "already_spent_for_attempt"`  
**Spend (insufficient)** — `400`, `reason: "insufficient_coins"`
