import { apiUrl } from '../config/api'
import type { CRMLead, CRMLeadInput } from '../types'

export async function fetchWebsiteLeads(): Promise<CRMLead[]> {
  const res = await fetch(apiUrl('/api/leads'))
  if (!res.ok) throw new Error('Failed to fetch website leads')
  return res.json() as Promise<CRMLead[]>
}

export async function patchWebsiteLead(id: string, updates: Partial<CRMLeadInput>): Promise<void> {
  await fetch(apiUrl(`/api/leads/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
}

export async function deleteWebsiteLead(id: string): Promise<void> {
  await fetch(apiUrl(`/api/leads/${id}`), { method: 'DELETE' })
}

export type WebsiteLeadPayload = {
  name: string
  phone: string
  email: string
  serviceNeeded: string
  message: string
}
