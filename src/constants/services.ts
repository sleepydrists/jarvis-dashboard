export const HG_SERVICES = [
  'Garage Cleanout',
  'Estate Cleanout',
  'Construction Debris',
  'Furniture Removal',
  'Yard Waste Removal',
  'Full House Cleanout',
  'Appliance Removal',
  'Hot Tub Removal',
]

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function generateQuoteNumber(seq: number) {
  const year = new Date().getFullYear()
  return `HG-${year}-${String(seq).padStart(4, '0')}`
}
