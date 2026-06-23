import type { CRMLead, CRMLeadInput, LeadStatus } from '../types'

const now = Date.now()
const day = 86400000

function manual(
  lead: Omit<CRMLead, 'email' | 'message' | 'source'> & Partial<Pick<CRMLead, 'email' | 'message'>>,
): CRMLead {
  return { email: '', message: '', source: 'manual', ...lead }
}

export const defaultLeads: CRMLead[] = [
  manual({
    id: '1',
    name: 'Marcus Chen',
    phone: '(503) 555-0142',
    email: 'marcus.chen@email.com',
    address: '1420 NE Alberta St, Portland',
    serviceNeeded: 'Garage Cleanout',
    status: 'new',
    quoteAmount: 0,
    createdAt: now - day * 1,
  }),
  manual({
    id: '2',
    name: 'Sarah Whitfield',
    phone: '(503) 555-0287',
    address: '890 Lake Oswego Dr, Lake Oswego',
    serviceNeeded: 'Estate Cleanout',
    status: 'quoted',
    quoteAmount: 1850,
    createdAt: now - day * 3,
    quotedAt: now - day * 2,
  }),
  manual({
    id: '3',
    name: 'David Ortiz',
    phone: '(503) 555-0391',
    address: '2205 SE Powell Blvd, Portland',
    serviceNeeded: 'Construction Debris',
    status: 'booked',
    quoteAmount: 920,
    createdAt: now - day * 5,
    quotedAt: now - day * 4,
    bookedAt: now - day * 2,
  }),
  manual({
    id: '4',
    name: 'Jennifer Park',
    phone: '(503) 555-0456',
    address: '5510 SW Beaverton Hillsdale Hwy',
    serviceNeeded: 'Furniture Removal',
    status: 'completed',
    quoteAmount: 475,
    createdAt: now - day * 12,
    quotedAt: now - day * 11,
    bookedAt: now - day * 8,
    completedAt: now - day * 6,
  }),
  manual({
    id: '5',
    name: 'Robert Hayes',
    phone: '(503) 555-0512',
    address: '1803 NW 23rd Ave, Portland',
    serviceNeeded: 'Full House Cleanout',
    status: 'contacted',
    quoteAmount: 0,
    createdAt: now - day * 2,
  }),
  manual({
    id: '6',
    name: 'Amanda Torres',
    phone: '(503) 555-0678',
    address: '7741 NE Sandy Blvd, Portland',
    serviceNeeded: 'Yard Waste Removal',
    status: 'booked',
    quoteAmount: 650,
    createdAt: now - day * 7,
    quotedAt: now - day * 6,
    bookedAt: now - day * 1,
  }),
  manual({
    id: '7',
    name: 'James Sullivan',
    phone: '(503) 555-0734',
    address: '3301 SE Woodstock Blvd, Portland',
    serviceNeeded: 'Appliance Removal',
    status: 'completed',
    quoteAmount: 325,
    createdAt: now - day * 18,
    quotedAt: now - day * 17,
    bookedAt: now - day * 14,
    completedAt: now - day * 10,
  }),
  manual({
    id: '8',
    name: 'Lisa Nguyen',
    phone: '(503) 555-0891',
    address: '915 NW Everett St, Portland',
    serviceNeeded: 'Hot Tub Removal',
    status: 'new',
    quoteAmount: 0,
    createdAt: now - day * 0.5,
  }),
  manual({
    id: '9',
    name: 'Michael Brooks',
    phone: '(503) 555-0945',
    address: '4405 SE Hawthorne Blvd, Portland',
    serviceNeeded: 'Garage Cleanout',
    status: 'completed',
    quoteAmount: 780,
    createdAt: now - day * 22,
    quotedAt: now - day * 21,
    bookedAt: now - day * 16,
    completedAt: now - day * 3,
  }),
  manual({
    id: '10',
    name: 'Thomas Reed',
    phone: '(503) 555-1156',
    address: '1200 SW 6th Ave, Portland',
    serviceNeeded: 'Estate Cleanout',
    status: 'booked',
    quoteAmount: 2450,
    createdAt: now - day * 4,
    quotedAt: now - day * 3,
    bookedAt: now - day * 0.5,
  }),
  manual({
    id: '11',
    name: 'Karen Mitchell',
    phone: '(503) 555-1289',
    address: '6700 NE Martin Luther King Jr Blvd',
    serviceNeeded: 'Furniture Removal',
    status: 'quoted',
    quoteAmount: 540,
    createdAt: now - day * 1,
    quotedAt: now - day * 0.25,
  }),
]

const LEGACY_STATUS: Record<string, LeadStatus> = {
  lead: 'new',
  lost: 'contacted',
}

export function normalizeLead(raw: unknown): CRMLead | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === 'string' ? r.id : crypto.randomUUID()
  const name =
    typeof r.name === 'string'
      ? r.name
      : typeof r.customerName === 'string'
        ? r.customerName
        : ''
  if (!name) return null

  const rawStatus = typeof r.status === 'string' ? r.status : 'new'
  const status = (LEGACY_STATUS[rawStatus] ?? rawStatus) as LeadStatus
  const validStatuses: LeadStatus[] = ['new', 'contacted', 'quoted', 'booked', 'completed']
  const safeStatus = validStatuses.includes(status) ? status : 'new'

  return {
    id,
    name,
    phone: typeof r.phone === 'string' ? r.phone : '',
    email: typeof r.email === 'string' ? r.email : '',
    address: typeof r.address === 'string' ? r.address : '',
    serviceNeeded:
      typeof r.serviceNeeded === 'string'
        ? r.serviceNeeded
        : typeof r.service === 'string'
          ? r.service
          : '',
    message: typeof r.message === 'string' ? r.message : '',
    quoteAmount: typeof r.quoteAmount === 'number' ? r.quoteAmount : 0,
    status: safeStatus,
    source: r.source === 'website' ? 'website' : 'manual',
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
    quotedAt: typeof r.quotedAt === 'number' ? r.quotedAt : undefined,
    bookedAt: typeof r.bookedAt === 'number' ? r.bookedAt : undefined,
    completedAt: typeof r.completedAt === 'number' ? r.completedAt : undefined,
  }
}

export function withStatusTimestamps(
  existing: CRMLead | undefined,
  input: CRMLeadInput,
): Pick<CRMLead, 'quotedAt' | 'bookedAt' | 'completedAt'> {
  const ts = Date.now()
  const quotedAt =
    input.status === 'quoted' || input.status === 'booked' || input.status === 'completed'
      ? (existing?.quotedAt ?? ts)
      : undefined
  const bookedAt =
    input.status === 'booked' || input.status === 'completed'
      ? (existing?.bookedAt ?? ts)
      : undefined
  const completedAt = input.status === 'completed' ? (existing?.completedAt ?? ts) : undefined
  return { quotedAt, bookedAt, completedAt }
}
