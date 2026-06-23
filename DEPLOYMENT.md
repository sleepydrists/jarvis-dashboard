# JARVIS Deployment Guide

Deploy the **HG Junk Removal JARVIS dashboard** as two services:

| Service | Host | Purpose |
|---------|------|---------|
| **Frontend** | [Vercel](https://vercel.com) | React dashboard (CRM, Estimator, Quotes) |
| **Backend API** | [Render](https://render.com) or [Railway](https://railway.app) | Lead intake, CRM sync, OpenAI proxy |

Local development is unchanged: `npm run dev` still runs Vite on `:5173` with `/api` proxied to `:3001`.

---

## Architecture

```
hgjunkremoval.com  ──POST /api/leads──▶  Render/Railway API  ◀──poll GET /api/leads──  Vercel Dashboard
                                              │
                                         Persistent disk
                                    (website-leads.json)
```

---

## 1. Deploy the API (Render — recommended)

### Option A: One-click Blueprint

1. Push this repo to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo — Render reads `render.yaml`.
4. Set these **secret** environment variables when prompted:
   - `LEAD_WEBHOOK_SECRET` — long random string (share with website only)
   - `OPENAI_API_KEY` — your OpenAI key
   - `ALLOWED_ORIGINS` — see below
5. Deploy. Note your API URL, e.g. `https://jarvis-api.onrender.com`.

### Option B: Manual Web Service

1. **New** → **Web Service** → connect GitHub repo.
2. Settings:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`
3. Add a **Persistent Disk**:
   - Mount path: `/var/data`
   - Size: 1 GB
4. Environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATA_DIR` | `/var/data` |
| `LEAD_WEBHOOK_SECRET` | *(generate a strong secret)* |
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `ALLOWED_ORIGINS` | See [CORS origins](#cors-origins) |

5. Deploy and copy the public URL.

### Verify API

```bash
curl https://YOUR-API-URL.onrender.com/api/health
```

Expected: `{"ok":true,"openai":true,...}`

Test lead intake:

```bash
curl -X POST https://YOUR-API-URL.onrender.com/api/leads \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d "{\"name\":\"Test User\",\"phone\":\"5035550100\",\"email\":\"test@example.com\",\"service\":\"Garage Cleanout\",\"message\":\"Test lead from deployment\"}"
```

Expected: `201` with JSON lead object, `status: "new"`, `source: "website"`.

---

## 2. Deploy the API (Railway — alternative)

1. Go to [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Railway detects `railway.toml` and runs `npm start`.
3. Add a **Volume**:
   - Mount path: `/var/data`
4. Set environment variables (same as Render table above).
5. **Settings** → **Networking** → **Generate Domain**.
6. Use the generated URL as your API base.

---

## 3. Deploy the Frontend (Vercel)

1. Go to [Vercel](https://vercel.com) → **Add New** → **Project** → import GitHub repo.
2. Framework preset: **Vite** (auto-detected via `vercel.json`).
3. **Environment variables** (Production):

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR-API-URL.onrender.com` *(no trailing slash)* |

4. Deploy. Note your dashboard URL, e.g. `https://jarvis-dashboard.vercel.app`.

5. **Update API CORS** — add the Vercel URL to `ALLOWED_ORIGINS` on Render/Railway:

```
https://hgjunkremoval.com,https://www.hgjunkremoval.com,https://jarvis-dashboard.vercel.app
```

Redeploy or restart the API after changing `ALLOWED_ORIGINS`.

---

## 4. Connect hgjunkremoval.com

Point your website quote form at the **production API**:

```javascript
const API_URL = 'https://YOUR-API-URL.onrender.com'
const WEBHOOK_SECRET = 'YOUR_LEAD_WEBHOOK_SECRET' // store server-side, not in client bundle if possible

async function submitQuoteRequest(form) {
  const res = await fetch(`${API_URL}/api/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({
      name: form.name,
      phone: form.phone,
      email: form.email,
      service: form.service,       // or serviceNeeded
      message: form.message,
    }),
  })

  if (!res.ok) throw new Error('Lead submission failed')
  return res.json()
}
```

### Accepted field names

The API accepts flexible keys:

| Field | Accepted keys |
|-------|---------------|
| Name | `name`, `customerName`, `fullName` |
| Phone | `phone`, `phoneNumber` |
| Email | `email`, `emailAddress` |
| Service | `service`, `serviceNeeded`, `serviceType` |
| Message | `message`, `notes`, `description` |

Leads appear in JARVIS CRM within ~3 seconds (dashboard polls automatically).

---

## CORS origins

Set `ALLOWED_ORIGINS` as a comma-separated list (no spaces required, but allowed):

```
http://localhost:5173,http://127.0.0.1:5173,https://hgjunkremoval.com,https://www.hgjunkremoval.com,https://YOUR-VERCEL-APP.vercel.app
```

Required origins:

- `https://hgjunkremoval.com` — website form submissions
- `https://www.hgjunkremoval.com` — www variant
- Your Vercel dashboard URL — CRM sync from browser
- `http://localhost:5173` — local dev (included in defaults)

---

## Environment variables reference

### Backend (Render / Railway / local `.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Auto | Set by host in production. Default `3001` locally. |
| `HOST` | No | Bind address. Default `0.0.0.0`. |
| `OPENAI_API_KEY` | For AI features | OpenAI API key for chat & estimator |
| `OPENAI_MODEL` | No | Chat model. Default `gpt-4o-mini`. |
| `OPENAI_VISION_MODEL` | No | Estimator vision model. Default `gpt-4o-mini`. |
| `LEAD_WEBHOOK_SECRET` | **Yes in prod** | Secret sent as `x-webhook-secret` header on `POST /api/leads` |
| `ALLOWED_ORIGINS` | **Yes in prod** | Comma-separated CORS origins |
| `DATA_DIR` | **Yes in prod** | Persistent path for leads file. Use `/var/data` with mounted disk. |

### Frontend (Vercel only)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes in prod** | API base URL, e.g. `https://jarvis-api.onrender.com`. Leave unset locally. |

---

## API endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/health` | None | Health check |
| `POST` | `/api/leads` | `x-webhook-secret` | **Website lead intake** |
| `GET` | `/api/leads` | None | CRM sync (dashboard poll) |
| `PATCH` | `/api/leads/:id` | None | Update lead status/details |
| `DELETE` | `/api/leads/:id` | None | Remove lead |
| `POST` | `/api/chat` | None | OpenAI chat proxy |
| `POST` | `/api/estimate` | None | AI estimator |

Legacy aliases `/api/leads/webhook` and `/api/leads/website/*` remain supported.

---

## Local development

Unchanged from before:

```bash
npm install
copy .env.example .env
# Edit .env — set OPENAI_API_KEY at minimum
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001
- `VITE_API_URL` should be **empty** locally — Vite proxies `/api` to the backend.
- Leads stored in `server/data/website-leads.json` (gitignored).

Test local lead intake:

```bash
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Local Test\",\"phone\":\"5035550100\",\"email\":\"local@test.com\",\"service\":\"Garage Cleanout\",\"message\":\"Hello\"}"
```

---

## Persistent storage

Website leads are stored in:

```
$DATA_DIR/website-leads.json
```

| Environment | `DATA_DIR` | Notes |
|-------------|------------|-------|
| Local | `server/data/` (default) | File created automatically |
| Render | `/var/data` | Requires persistent disk in `render.yaml` |
| Railway | `/var/data` | Requires mounted volume |

**Without a persistent disk**, leads are lost on redeploy. Always mount storage in production.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Website form blocked by CORS | Add `https://hgjunkremoval.com` to `ALLOWED_ORIGINS` on API |
| CRM shows no website leads | Set `VITE_API_URL` on Vercel; add Vercel URL to `ALLOWED_ORIGINS` |
| `401 Invalid webhook secret` | Match `x-webhook-secret` header with `LEAD_WEBHOOK_SECRET` |
| Leads disappear after redeploy | Mount persistent disk; set `DATA_DIR=/var/data` |
| API health fails on Render | Check logs; ensure `npm start` runs `server/index.js` |
| Local dev broken | Do **not** set `VITE_API_URL` in local `.env` |

---

## Checklist

- [ ] API deployed on Render or Railway with persistent disk
- [ ] `LEAD_WEBHOOK_SECRET` set on API
- [ ] `ALLOWED_ORIGINS` includes hgjunkremoval.com + Vercel dashboard URL
- [ ] `POST /api/leads` test returns `201`
- [ ] Frontend deployed on Vercel with `VITE_API_URL`
- [ ] CRM shows website leads after test submission
- [ ] hgjunkremoval.com form updated to production API URL
