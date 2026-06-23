import { jsPDF } from 'jspdf'
import type { HGQuote } from '../types'
import { formatCurrency } from '../constants/services'

const TERMS = [
  'Quote valid for 14 days from issue date.',
  'Final price may adjust if scope changes on-site.',
  'Payment due upon job completion unless otherwise agreed.',
  'HG Junk Removal is licensed and insured in Oregon.',
]

export function exportQuotePdf(quote: HGQuote) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 48
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = margin

  doc.setFillColor(5, 8, 16)
  doc.rect(0, 0, pageWidth, 90, 'F')
  doc.setTextColor(0, 212, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('HG JUNK REMOVAL', margin, 40)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 240)
  doc.text('Professional Junk Removal · Portland Metro', margin, 58)
  doc.text('(503) 555-HGJK · hgjunkremoval.com', margin, 72)

  doc.setTextColor(30, 40, 55)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  y = 120
  doc.text('SERVICE QUOTE', margin, y)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 90, 105)
  y += 22
  doc.text(`Quote #: ${quote.quoteNumber}`, margin, y)
  doc.text(
    `Date: ${new Date(quote.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    pageWidth - margin - 140,
    y,
  )

  y += 28
  doc.setDrawColor(0, 180, 220)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)

  y += 24
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 40, 55)
  doc.text('Customer', margin, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 70, 85)
  doc.text(quote.customerName, margin, y)
  y += 14
  doc.text(quote.phone, margin, y)
  y += 14
  const addressLines = doc.splitTextToSize(quote.address || '—', pageWidth - margin * 2)
  doc.text(addressLines, margin, y)
  y += addressLines.length * 14 + 16

  doc.setFillColor(240, 248, 255)
  doc.rect(margin, y, pageWidth - margin * 2, 52, 'F')
  doc.setDrawColor(0, 180, 220)
  doc.rect(margin, y, pageWidth - margin * 2, 52, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 120, 160)
  doc.text('Service', margin + 12, y + 20)
  doc.text('Amount', pageWidth - margin - 80, y + 20, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 40, 55)
  doc.text(quote.service, margin + 12, y + 38)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(quote.quoteAmount), pageWidth - margin - 12, y + 38, { align: 'right' })

  y += 72
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Total: ${formatCurrency(quote.quoteAmount)}`, pageWidth - margin, y, { align: 'right' })

  if (quote.notes.trim()) {
    y += 32
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 40, 55)
    doc.text('Notes', margin, y)
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 70, 85)
    const noteLines = doc.splitTextToSize(quote.notes, pageWidth - margin * 2)
    doc.text(noteLines, margin, y)
  }

  y += 40
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0, 120, 160)
  doc.text('Terms & Conditions', margin, y)
  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90, 100, 115)
  for (const term of TERMS) {
    doc.text(`• ${term}`, margin + 4, y)
    y += 13
  }

  y += 16
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.text('Thank you for choosing HG Junk Removal!', margin, y)

  doc.save(`${quote.quoteNumber}-${quote.customerName.replace(/\s+/g, '-')}.pdf`)
}
