import type { EstimateInput, EstimateResult } from '../types'
import { apiUrl } from '../config/api'

const SERVICE_BASE: Record<string, { min: number; max: number; hours: number; loads: number }> = {
  'Garage Cleanout': { min: 275, max: 650, hours: 2, loads: 1 },
  'Estate Cleanout': { min: 1200, max: 4500, hours: 8, loads: 3 },
  'Construction Debris': { min: 350, max: 1200, hours: 3, loads: 2 },
  'Furniture Removal': { min: 150, max: 450, hours: 1.5, loads: 1 },
  'Yard Waste Removal': { min: 200, max: 550, hours: 2, loads: 1 },
  'Full House Cleanout': { min: 1800, max: 5500, hours: 10, loads: 4 },
  'Appliance Removal': { min: 95, max: 275, hours: 1, loads: 0.5 },
  'Hot Tub Removal': { min: 350, max: 650, hours: 2.5, loads: 1 },
}

const HEAVY_KEYWORDS = ['heavy', 'large', 'multiple', 'full', 'entire', 'lot', 'pile', 'hoard', 'basement', 'attic']
const LIGHT_KEYWORDS = ['small', 'few', 'single', 'minor', 'light', 'quick']

function scaleFromText(text: string): number {
  const lower = text.toLowerCase()
  let scale = 1
  for (const word of HEAVY_KEYWORDS) {
    if (lower.includes(word)) scale += 0.15
  }
  for (const word of LIGHT_KEYWORDS) {
    if (lower.includes(word)) scale -= 0.1
  }
  return Math.min(2.2, Math.max(0.75, scale))
}

export function generateLocalEstimate(input: EstimateInput): EstimateResult {
  const base = SERVICE_BASE[input.serviceType] ?? { min: 250, max: 600, hours: 2, loads: 1 }
  const textScale = scaleFromText(input.description)
  const photoScale = 1 + input.photos.length * 0.12

  const scale = textScale * photoScale
  const quoteMin = Math.round(base.min * scale / 25) * 25
  const quoteMax = Math.round(base.max * scale / 25) * 25
  const laborHours = Math.round(base.hours * scale * 2) / 2
  const truckLoads = Math.max(0.5, Math.round(base.loads * scale * 2) / 2)

  return {
    quoteMin,
    quoteMax: Math.max(quoteMin + 50, quoteMax),
    laborHours,
    truckLoads,
    summary: `Local estimate for ${input.serviceType.toLowerCase()} based on job description${input.photos.length ? ` and ${input.photos.length} photo(s)` : ''}.`,
    source: 'local',
  }
}

export async function requestAiEstimate(input: EstimateInput): Promise<EstimateResult> {
  const res = await fetch(apiUrl('/api/estimate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Estimate request failed' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<EstimateResult>
}

export async function generateEstimate(input: EstimateInput): Promise<EstimateResult> {
  try {
    return await requestAiEstimate(input)
  } catch {
    return generateLocalEstimate(input)
  }
}

export function formatQuoteRange(min: number, max: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(min)
    + ' – '
    + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(max)
}

export const ESTIMATOR_SERVICES = Object.keys(SERVICE_BASE)

export async function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read photo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Invalid image'))
      img.onload = () => {
        const maxDim = 640
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
