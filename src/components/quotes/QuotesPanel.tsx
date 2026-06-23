import {
  CheckCircle,
  Download,
  FileText,
  History,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { HG_SERVICES, formatCurrency } from '../../constants/services'
import { exportQuotePdf } from '../../services/quotePdf'
import { useJarvisStore } from '../../store/useJarvisStore'
import type { HGQuote, QuoteDecision, QuoteInput } from '../../types'

const statusLabels: Record<QuoteDecision, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
}

const statusColors: Record<QuoteDecision, string> = {
  pending: 'var(--warning)',
  accepted: 'var(--success)',
  declined: 'var(--danger)',
}

const emptyForm = (): QuoteInput => ({
  customerName: '',
  phone: '',
  address: '',
  service: HG_SERVICES[0],
  quoteAmount: 0,
  notes: '',
})

function QuoteDocument({ quote }: { quote: HGQuote }) {
  const date = new Date(quote.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="quote-document fade-in">
      <div className="quote-document-glow" />
      <div className="quote-document-header">
        <div>
          <h2 className="quote-document-brand">HG JUNK REMOVAL</h2>
          <p className="quote-document-tagline">Professional Junk Removal · Portland Metro</p>
        </div>
        <div className="quote-document-meta">
          <span className="quote-document-number">{quote.quoteNumber}</span>
          <span className="quote-document-date">{date}</span>
        </div>
      </div>

      <div className="quote-document-section">
        <p className="quote-document-label">Prepared For</p>
        <p className="quote-document-value">{quote.customerName}</p>
        <p className="quote-document-sub">{quote.phone}</p>
        <p className="quote-document-sub">{quote.address || '—'}</p>
      </div>

      <div className="quote-document-line-items">
        <div className="quote-document-line-head">
          <span>Service</span>
          <span>Amount</span>
        </div>
        <div className="quote-document-line-row">
          <span>{quote.service}</span>
          <span className="quote-document-amount">{formatCurrency(quote.quoteAmount)}</span>
        </div>
        <div className="quote-document-total">
          <span>Total</span>
          <span>{formatCurrency(quote.quoteAmount)}</span>
        </div>
      </div>

      {quote.notes.trim() && (
        <div className="quote-document-section">
          <p className="quote-document-label">Notes</p>
          <p className="quote-document-notes">{quote.notes}</p>
        </div>
      )}

      <div className="quote-document-terms">
        <p className="quote-document-label">Terms</p>
        <ul>
          <li>Quote valid for 14 days from issue date.</li>
          <li>Final price may adjust if scope changes on-site.</li>
          <li>Payment due upon job completion unless otherwise agreed.</li>
        </ul>
      </div>
    </div>
  )
}

function HistoryItem({
  quote,
  active,
  onSelect,
  onDelete,
}: {
  quote: HGQuote
  active: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const date = new Date(quote.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className={`estimator-history-item ${active ? 'active' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      role="button"
      tabIndex={0}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="estimator-history-title">{quote.customerName}</p>
        <p className="estimator-history-meta">{quote.quoteNumber} · {date}</p>
        <p className="estimator-history-range">{formatCurrency(quote.quoteAmount)}</p>
        <span className="crm-status-badge" style={{ color: statusColors[quote.status], borderColor: statusColors[quote.status], marginTop: 4 }}>
          {statusLabels[quote.status]}
        </span>
      </div>
      <button
        className="btn btn-danger"
        style={{ padding: '4px 6px' }}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Delete quote"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

export function QuotesPanel() {
  const { quotes, addQuote, setQuoteStatus, removeQuote } = useJarvisStore()

  const [form, setForm] = useState(emptyForm)
  const [amountInput, setAmountInput] = useState('')
  const [activeQuote, setActiveQuote] = useState<HGQuote | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const updateField = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleGenerate = () => {
    if (!form.customerName.trim() || !form.phone.trim()) {
      setError('Customer name and phone are required.')
      return
    }
    const amount = parseFloat(amountInput)
    if (!amountInput || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid quote amount.')
      return
    }
    setError('')

    const input: QuoteInput = {
      ...form,
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      quoteAmount: amount,
      notes: form.notes.trim(),
    }

    const quote = addQuote(input)
    setActiveQuote(quote)
    setSelectedId(quote.id)
  }

  const selectQuote = (quote: HGQuote) => {
    setSelectedId(quote.id)
    setActiveQuote(quote)
    setForm({
      customerName: quote.customerName,
      phone: quote.phone,
      address: quote.address,
      service: quote.service,
      quoteAmount: quote.quoteAmount,
      notes: quote.notes,
    })
    setAmountInput(String(quote.quoteAmount))
  }

  const clearForm = () => {
    setForm(emptyForm())
    setAmountInput('')
    setActiveQuote(null)
    setSelectedId(null)
    setError('')
  }

  const handleExport = () => {
    if (activeQuote) exportQuotePdf(activeQuote)
  }

  const displayQuote = selectedId ? quotes.find((q) => q.id === selectedId) ?? null : activeQuote

  return (
    <div className="panel fade-in quotes-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div>
          <span className="panel-title">Quote Generator — HG Junk Removal</span>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.08em', marginTop: 2 }}>
            PROFESSIONAL QUOTE MODULE
          </p>
        </div>
        <FileText size={14} color="var(--accent-cyan)" />
      </div>

      <div className="estimator-layout panel-body">
        <div className="estimator-form-col">
          <div className="quotes-form-grid">
            <label className="crm-field">
              <span className="crm-field-label">Customer Name</span>
              <input className="input" value={form.customerName} onChange={(e) => updateField('customerName', e.target.value)} placeholder="Full name" />
            </label>
            <label className="crm-field">
              <span className="crm-field-label">Phone</span>
              <input className="input" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(503) 555-0100" />
            </label>
            <label className="crm-field" style={{ gridColumn: '1 / -1' }}>
              <span className="crm-field-label">Address</span>
              <input className="input" value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Street, city, zip" />
            </label>
            <label className="crm-field">
              <span className="crm-field-label">Service</span>
              <select className="input" value={form.service} onChange={(e) => updateField('service', e.target.value)} style={{ cursor: 'pointer' }}>
                {HG_SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="crm-field">
              <span className="crm-field-label">Quote Amount</span>
              <input className="input" type="number" min="0" step="1" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} placeholder="0" />
            </label>
            <label className="crm-field" style={{ gridColumn: '1 / -1' }}>
              <span className="crm-field-label">Notes</span>
              <textarea className="input estimator-textarea" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Access details, special instructions, etc." rows={3} />
            </label>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn active" onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Generate Quote
            </button>
            <button className="btn" onClick={clearForm}>Clear</button>
            {displayQuote && (
              <button className="btn" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Export PDF
              </button>
            )}
          </div>

          {displayQuote && (
            <>
              <QuoteDocument quote={displayQuote} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {displayQuote.status === 'pending' && (
                  <>
                    <button
                      className="btn"
                      onClick={() => setQuoteStatus(displayQuote.id, 'accepted')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <CheckCircle size={14} /> Mark Accepted
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => setQuoteStatus(displayQuote.id, 'declined')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <XCircle size={14} /> Mark Declined
                    </button>
                  </>
                )}
                {displayQuote.status !== 'pending' && (
                  <span className="crm-status-badge" style={{ color: statusColors[displayQuote.status], borderColor: statusColors[displayQuote.status] }}>
                    {statusLabels[displayQuote.status]}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="estimator-history-col">
          <div className="estimator-history-header">
            <History size={14} color="var(--accent-cyan)" />
            <span className="panel-title">Quote History</span>
            <span className="estimator-history-count">{quotes.length}</span>
          </div>
          <div className="estimator-history-list">
            {quotes.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: 24 }}>
                No saved quotes yet
              </p>
            ) : (
              quotes.map((quote) => (
                <HistoryItem
                  key={quote.id}
                  quote={quote}
                  active={selectedId === quote.id}
                  onSelect={() => selectQuote(quote)}
                  onDelete={() => {
                    removeQuote(quote.id)
                    if (selectedId === quote.id) {
                      setSelectedId(null)
                      setActiveQuote(null)
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
