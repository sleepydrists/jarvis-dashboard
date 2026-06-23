# JARVIS Deployment Checklist

Complete these steps in order. Each step has a checkbox — mark when done.

**Expected URLs** (after deploy):

| Service | URL |
|---------|-----|
| **GitHub Repo** | https://github.com/sleepydrists/jarvis-dashboard ✅ **LIVE** |
| **Render API** | https://jarvis-api.onrender.com |
| **Vercel Dashboard** | https://jarvis-dashboard.vercel.app *(or your assigned Vercel subdomain)* |

---

## Phase 0 — One-time setup on your machine

- [ ] **Install tools** (already done if you ran this from Cursor):
  ```powershell
  winget install Git.Git GitHub.cli
  ```
- [ ] **Log in to GitHub CLI** (required once):
  ```powershell
  gh auth login
  ```
  Choose: GitHub.com → HTTPS → Login with browser

- [ ] **Log in to Vercel** (pick one):
  ```powershell
  npx vercel login
  ```
  OR set a token:
  ```powershell
  $env:VERCEL_TOKEN = "your-vercel-token"
  ```
  Get token: https://vercel.com/account/tokens

- [ ] **Create Render account** (free): https://dashboard.render.com/register

---

## Phase 1 — Push code to GitHub ✅ DONE

Repo is live: **https://github.com/sleepydrists/jarvis-dashboard**

- [x] Repo exists at https://github.com/sleepydrists/jarvis-dashboard
- [x] All files pushed to `main`

---

## Phase 2 — Deploy API on Render

- [ ] Open **Render Blueprints**: https://dashboard.render.com/blueprints
- [ ] Click **New Blueprint Instance**
- [ ] Connect GitHub → select **`sleepydrists/jarvis-dashboard`** repo
- [ ] Render reads `render.yaml` and creates service **`jarvis-api`**
- [ ] When prompted, set these **secret** environment variables:

| Variable | Value |
|----------|-------|
| `LEAD_WEBHOOK_SECRET` | Generate: `[System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N")` |
| `OPENAI_API_KEY` | Your `sk-...` key |
| `ALLOWED_ORIGINS` | `https://hgjunkremoval.com,https://www.hgjunkremoval.com,https://jarvis-dashboard.vercel.app,http://localhost:5173` |

  *(Update Vercel URL in `ALLOWED_ORIGINS` after Phase 3 if your URL differs.)*

- [ ] Click **Apply** and wait for deploy (~3–5 min)
- [ ] Confirm **persistent disk** mounted at `/var/data` (from `render.yaml`)

**Your Render API URL:**
```
https://jarvis-api.onrender.com
```

**Verify API:**
```powershell
curl https://jarvis-api.onrender.com/api/health
```
Expected: `{"ok":true,"openai":true,...}`

- [ ] Health check returns `ok: true`

**Test lead intake:**
```powershell
curl -X POST https://jarvis-api.onrender.com/api/leads `
  -H "Content-Type: application/json" `
  -H "x-webhook-secret: YOUR_LEAD_WEBHOOK_SECRET" `
  -d '{\"name\":\"Deploy Test\",\"phone\":\"5035550100\",\"email\":\"test@example.com\",\"service\":\"Garage Cleanout\",\"message\":\"Checklist test lead\"}'
```
Expected: HTTP `201` with JSON lead, `"status":"new"`, `"source":"website"`

- [ ] Test lead returns `201`

**Or run helper** (opens Render dashboard):
```powershell
.\scripts\deploy-render.ps1
```

---

## Phase 3 — Deploy frontend on Vercel

Set your Render API URL, then deploy:

```powershell
$env:RENDER_API_URL = "https://jarvis-api.onrender.com"
.\scripts\deploy-vercel.ps1
```

**Manual fallback** (Vercel dashboard):
1. Open: https://vercel.com/new/clone?repository-url=https://github.com/sleepydrists/jarvis-dashboard
2. Framework: **Vite** (auto-detected from `vercel.json`)
3. Environment variable:
   - `VITE_API_URL` = `https://jarvis-api.onrender.com`
4. Deploy

**Your Vercel dashboard URL:**
```
https://jarvis-dashboard.vercel.app
```
*(Check Vercel dashboard for exact URL if name was taken.)*

- [ ] Dashboard loads in browser
- [ ] CRM tab opens without errors
- [ ] Open browser DevTools → Network → confirm requests go to `jarvis-api.onrender.com`

---

## Phase 4 — Wire CORS (if CRM sync fails)

If website leads don't appear in CRM:

- [ ] Copy your **exact** Vercel URL from the Vercel dashboard
- [ ] In **Render** → `jarvis-api` → **Environment** → edit `ALLOWED_ORIGINS`:
  ```
  https://hgjunkremoval.com,https://www.hgjunkremoval.com,https://YOUR-VERCEL-URL.vercel.app,http://localhost:5173
  ```
- [ ] Save → Render redeploys automatically
- [ ] Submit another test lead → appears in CRM within ~3 seconds

- [ ] Website leads sync to CRM

---

## Phase 5 — Connect hgjunkremoval.com

Add this to your website quote form handler (server-side preferred for the secret):

```javascript
const JARVIS_API = 'https://jarvis-api.onrender.com'
const WEBHOOK_SECRET = 'YOUR_LEAD_WEBHOOK_SECRET' // from Render env

await fetch(`${JARVIS_API}/api/leads`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': WEBHOOK_SECRET,
  },
  body: JSON.stringify({
    name: form.name,
    phone: form.phone,
    email: form.email,
    service: form.service,
    message: form.message,
  }),
})
```

- [ ] Website form POSTs to `https://jarvis-api.onrender.com/api/leads`
- [ ] Real lead from website appears in JARVIS CRM

---

## Phase 6 — Final verification

| Check | Status |
|-------|--------|
| `GET /api/health` → `ok: true` | ☐ |
| `POST /api/leads` → `201` | ☐ |
| Vercel dashboard loads | ☐ |
| CRM shows website leads | ☐ |
| Local dev still works (`npm run dev`, no `VITE_API_URL` in `.env`) | ☐ |

---

## Quick reference — all URLs

Fill in after deploy:

```
GitHub:  https://github.com/sleepydrists/jarvis-dashboard  ✅
Render:  https://jarvis-api.onrender.com
Vercel:  https://jarvis-dashboard.vercel.app
Website: https://hgjunkremoval.com  →  POST /api/leads
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `gh: not authenticated` | Run `gh auth login` |
| Render build fails | Check Render logs; ensure `npm start` runs `server/index.js` |
| Vercel build fails | Run `npm run build` locally first |
| CRM empty, no errors | Set `VITE_API_URL` on Vercel; add Vercel URL to `ALLOWED_ORIGINS` |
| `401 Invalid webhook secret` | Match header with `LEAD_WEBHOOK_SECRET` on Render |
| Leads lost after redeploy | Confirm disk mounted at `/var/data`, `DATA_DIR=/var/data` |
| Local dev broken | Remove `VITE_API_URL` from local `.env` |

---

## One-command deploy (after auth)

Once `gh auth login` and `npx vercel login` are done:

```powershell
cd C:\Users\sleep\Projects\jarvis-dashboard
$env:RENDER_API_URL = "https://jarvis-api.onrender.com"
.\scripts\deploy-all.ps1
```

Then complete Render Blueprint manually (Phase 2) if not already done.

See also: [DEPLOYMENT.md](./DEPLOYMENT.md) for architecture and env var reference.
