import { randomUUID } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, 'data')
const DATA_FILE = join(DATA_DIR, 'website-leads.json')

async function ensureStore() {
  await mkdir(dirname(DATA_FILE), { recursive: true })
  try {
    await readFile(DATA_FILE, 'utf8')
  } catch {
    await writeFile(DATA_FILE, '[]', 'utf8')
  }
}

async function readLeads() {
  await ensureStore()
  const raw = await readFile(DATA_FILE, 'utf8')
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

async function writeLeads(leads) {
  await ensureStore()
  await writeFile(DATA_FILE, JSON.stringify(leads, null, 2), 'utf8')
}

export async function listWebsiteLeads() {
  const leads = await readLeads()
  return leads.sort((a, b) => b.createdAt - a.createdAt)
}

export function getLeadsStorePath() {
  return DATA_FILE
}

export async function createWebsiteLead(input) {
  const leads = await readLeads()
  const lead = {
    id: randomUUID(),
    name: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address ?? '',
    serviceNeeded: input.serviceNeeded,
    message: input.message,
    quoteAmount: 0,
    status: 'new',
    source: 'website',
    createdAt: Date.now(),
  }
  leads.unshift(lead)
  await writeLeads(leads)
  return lead
}

export async function updateWebsiteLead(id, updates) {
  const leads = await readLeads()
  const index = leads.findIndex((l) => l.id === id)
  if (index === -1) return null

  const existing = leads[index]
  const next = {
    ...existing,
    ...updates,
    id: existing.id,
    source: 'website',
    createdAt: existing.createdAt,
    ...applyStatusTimestamps(existing, updates),
  }
  leads[index] = next
  await writeLeads(leads)
  return next
}

export async function deleteWebsiteLead(id) {
  const leads = await readLeads()
  const filtered = leads.filter((l) => l.id !== id)
  if (filtered.length === leads.length) return false
  await writeLeads(filtered)
  return true
}

function applyStatusTimestamps(existing, updates) {
  const ts = Date.now()
  const status = updates.status ?? existing.status
  const timestamps = {}

  if (status === 'quoted' || status === 'booked' || status === 'completed') {
    timestamps.quotedAt = existing.quotedAt ?? ts
  }
  if (status === 'booked' || status === 'completed') {
    timestamps.bookedAt = existing.bookedAt ?? ts
  }
  if (status === 'completed') {
    timestamps.completedAt = existing.completedAt ?? ts
  }

  return timestamps
}
