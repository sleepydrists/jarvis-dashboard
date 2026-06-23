import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import {
  createWebsiteLead,
  deleteWebsiteLead,
  getLeadsStorePath,
  listWebsiteLeads,
  updateWebsiteLead,
} from './leadsStore.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001
const HOST = process.env.HOST ?? '0.0.0.0'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
const VISION_MODEL = process.env.OPENAI_VISION_MODEL ?? 'gpt-4o-mini'
const LEAD_WEBHOOK_SECRET = process.env.LEAD_WEBHOOK_SECRET
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,https://hgjunkremoval.com,https://www.hgjunkremoval.com')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true)
      return
    }
    callback(null, false)
  },
}))
app.use(express.json({ limit: '12mb' }))

function openAiConfigured() {
  return Boolean(OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-your-key-here')
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    openai: openAiConfigured(),
    model: OPENAI_MODEL,
    leadsStore: getLeadsStorePath(),
  })
})

app.post('/api/chat', async (req, res) => {
  if (!openAiConfigured()) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured. Copy .env.example to .env and add your key.' })
  }

  const { messages } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        error: err.error?.message ?? `OpenAI API error (${response.status})`,
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? 'No response generated.'
    res.json({ content })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
})

app.post('/api/estimate', async (req, res) => {
  if (!openAiConfigured()) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured' })
  }

  const { serviceType, description, photos } = req.body
  if (!serviceType || !description) {
    return res.status(400).json({ error: 'serviceType and description required' })
  }

  const systemPrompt = `You are HG Junk Removal's AI estimator in Portland, Oregon.
Analyze the job and return ONLY valid JSON (no markdown) with these keys:
- quoteMin (number, USD)
- quoteMax (number, USD)
- laborHours (number, can be decimal like 2.5)
- truckLoads (number, can be decimal like 1.5)
- summary (string, 1-2 sentences explaining the estimate)

Use realistic junk removal pricing. Consider volume, weight, access, and disposal fees.`

  const userText = `Service Type: ${serviceType}\nJob Description: ${description}\nPhotos provided: ${Array.isArray(photos) ? photos.length : 0}`

  const userContent = Array.isArray(photos) && photos.length > 0
    ? [
        { type: 'text', text: userText },
        ...photos.slice(0, 4).map((url) => ({ type: 'image_url', image_url: { url, detail: 'low' } })),
      ]
    : userText

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.4,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        error: err.error?.message ?? `OpenAI API error (${response.status})`,
      })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)

    const quoteMin = Math.round(Number(parsed.quoteMin) || 250)
    const quoteMax = Math.round(Number(parsed.quoteMax) || quoteMin + 200)

    res.json({
      quoteMin,
      quoteMax: Math.max(quoteMin + 50, quoteMax),
      laborHours: Number(parsed.laborHours) || 2,
      truckLoads: Number(parsed.truckLoads) || 1,
      summary: String(parsed.summary || `AI estimate for ${serviceType}.`),
      source: 'ai',
    })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
})

function pickLeadFields(body) {
  const name = body.name ?? body.customerName ?? body.fullName
  const phone = body.phone ?? body.phoneNumber
  const email = body.email ?? body.emailAddress ?? ''
  const serviceNeeded = body.serviceNeeded ?? body.service ?? body.serviceType ?? 'General Junk Removal'
  const message = body.message ?? body.notes ?? body.description ?? ''
  return { name, phone, email, serviceNeeded, message }
}

function validateWebhookLead(fields) {
  if (!fields.name?.trim()) return 'name is required'
  if (!fields.phone?.trim()) return 'phone is required'
  if (!fields.email?.trim()) return 'email is required'
  if (!fields.serviceNeeded?.trim()) return 'service is required'
  return null
}

function verifyLeadSecret(req, res) {
  if (!LEAD_WEBHOOK_SECRET) return true
  const secret = req.headers['x-webhook-secret'] ?? req.headers['x-lead-webhook-secret']
  if (secret !== LEAD_WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Invalid webhook secret' })
    return false
  }
  return true
}

async function handleCreateLead(req, res) {
  if (!verifyLeadSecret(req, res)) return

  const fields = pickLeadFields(req.body)
  const error = validateWebhookLead(fields)
  if (error) return res.status(400).json({ error })

  try {
    const lead = await createWebsiteLead({
      name: fields.name.trim(),
      phone: fields.phone.trim(),
      email: fields.email.trim(),
      serviceNeeded: fields.serviceNeeded.trim(),
      message: String(fields.message).trim(),
      address: String(req.body.address ?? '').trim(),
    })
    res.status(201).json(lead)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
}

async function handleListLeads(_req, res) {
  try {
    const leads = await listWebsiteLeads()
    res.json(leads)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
}

async function handleUpdateLead(req, res) {
  try {
    const lead = await updateWebsiteLead(req.params.id, req.body)
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json(lead)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
}

async function handleDeleteLead(req, res) {
  try {
    const ok = await deleteWebsiteLead(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Lead not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
}

/** Public lead intake — used by hgjunkremoval.com quote forms */
app.post('/api/leads', handleCreateLead)
app.post('/api/leads/webhook', handleCreateLead)

/** CRM sync — polled by JARVIS dashboard */
app.get('/api/leads', handleListLeads)
app.get('/api/leads/website', handleListLeads)

app.patch('/api/leads/:id', handleUpdateLead)
app.patch('/api/leads/website/:id', handleUpdateLead)

app.delete('/api/leads/:id', handleDeleteLead)
app.delete('/api/leads/website/:id', handleDeleteLead)

app.listen(PORT, HOST, () => {
  console.log(`JARVIS API server running on http://${HOST}:${PORT}`)
  console.log(`Leads store: ${getLeadsStorePath()}`)
})
