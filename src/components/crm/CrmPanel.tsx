import {
  Briefcase,
  DollarSign,
  FileText,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useJarvisStore } from '../../store/useJarvisStore'
import type { CRMLead, CrmFormMode, CrmTab, LeadStatus } from '../../types'

const SERVICES = [
  'Garage Cleanout',
  'Estate Cleanout',
  'Construction Debris',
  'Furniture Removal',
  'Yard Waste Removal',
  'Full House Cleanout',
  'Appliance Removal',
  'Hot Tub Removal',
]

const ALL_STATUSES: LeadStatus[] = ['new', 'contacted', 'quoted', 'booked', 'completed']

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  booked: 'Booked',
  completed: 'Completed',
}

const statusColors: Record<LeadStatus, string> = {
  new: 'var(--accent-cyan)',
  contacted: 'var(--accent-blue)',
  quoted: 'var(--warning)',
  booked: 'var(--accent-purple)',
  completed: 'var(--success)',
}

const crmTabs: { id: CrmTab; label: string; icon: typeof UserPlus }[] = [
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'quotes', label: 'Quotes', icon: FileText },
  { id: 'jobs', label: 'Jobs Booked', icon: Briefcase },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
]

interface FormState {
  name: string
  phone: string
  email: string
  address: string
  serviceNeeded: string
  message: string
  quoteAmount: string
  status: LeadStatus
}

const emptyForm = (): FormState => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  serviceNeeded: SERVICES[0],
  message: '',
  quoteAmount: '',
  status: 'new',
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function filterLeadsByTab(leads: CRMLead[], tab: CrmTab): CRMLead[] {
  switch (tab) {
    case 'leads':
      return leads.filter((l) => l.status === 'new' || l.status === 'contacted')
    case 'quotes':
      return leads.filter((l) => l.status === 'quoted')
    case 'jobs':
      return leads.filter((l) => l.status === 'booked')
    case 'revenue':
      return leads.filter((l) => l.status === 'completed')
    default:
      return leads
  }
}

function formFromLead(lead: CRMLead): FormState {
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    serviceNeeded: lead.serviceNeeded,
    message: lead.message,
    quoteAmount: lead.quoteAmount > 0 ? String(lead.quoteAmount) : '',
    status: lead.status,
  }
}

function truncate(text: string, max: number) {
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function CrmPanel() {
  const { leads, crmTab, setCrmTab, addLead, updateLead, removeLead } = useJarvisStore()

  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<CrmFormMode | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const stats = useMemo(() => {
    const totalLeads = leads.length
    const websiteLeads = leads.filter((l) => l.source === 'website').length
    const quotesSent = leads.filter((l) => ['quoted', 'booked', 'completed'].includes(l.status)).length
    const jobsBooked = leads.filter((l) => l.status === 'booked' || l.status === 'completed').length
    const revenue = leads
      .filter((l) => l.status === 'completed')
      .reduce((sum, l) => sum + l.quoteAmount, 0)
    return { totalLeads, websiteLeads, quotesSent, jobsBooked, revenue }
  }, [leads])

  const filteredLeads = useMemo(() => {
    const tabFiltered = filterLeadsByTab(leads, crmTab)
    const sorted = [...tabFiltered].sort((a, b) => b.createdAt - a.createdAt)
    if (!search.trim()) return sorted
    const q = search.toLowerCase()
    return sorted.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        l.serviceNeeded.toLowerCase().includes(q),
    )
  }, [leads, crmTab, search])

  const openForm = (mode: CrmFormMode, lead?: CRMLead) => {
    setFormMode(mode)
    setEditingId(lead?.id ?? null)
    if (lead) {
      setForm(formFromLead(lead))
    } else if (mode === 'customer') {
      setForm({ ...emptyForm(), status: 'new', quoteAmount: '' })
    } else if (mode === 'quote') {
      setForm({ ...emptyForm(), status: 'quoted', quoteAmount: '' })
    } else {
      setForm(emptyForm())
    }
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingId(null)
    setForm(emptyForm())
  }

  const handleSubmit = () => {
    if (!form.name.trim() || !form.phone.trim()) return

    const quoteAmount = parseFloat(form.quoteAmount) || 0
    if (formMode === 'quote' && quoteAmount <= 0) return

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      serviceNeeded: form.serviceNeeded,
      message: form.message.trim(),
      quoteAmount,
      status: form.status,
    }

    if (formMode === 'customer') {
      payload.status = 'new'
      payload.quoteAmount = 0
    } else if (formMode === 'quote') {
      payload.status = 'quoted'
      payload.quoteAmount = quoteAmount
    } else if (formMode === 'lead' && !form.quoteAmount) {
      payload.quoteAmount = 0
    }

    if (formMode === 'edit' && editingId) {
      updateLead(editingId, payload)
    } else {
      addLead(payload)
    }
    closeForm()
  }

  const formTitles: Record<CrmFormMode, string> = {
    lead: 'Add Lead',
    customer: 'Add Customer',
    quote: 'Add Quote',
    edit: 'Edit Lead',
  }

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: UserPlus, color: 'var(--accent-cyan)' },
    { label: 'Quotes Sent', value: stats.quotesSent, icon: FileText, color: 'var(--warning)' },
    { label: 'Jobs Booked', value: stats.jobsBooked, icon: Briefcase, color: 'var(--accent-purple)' },
    { label: 'Revenue', value: formatCurrency(stats.revenue), icon: DollarSign, color: 'var(--success)' },
  ]

  const showStatusField = formMode === 'lead' || formMode === 'edit'
  const showQuoteField = formMode !== 'customer'
  const quoteRequired = formMode === 'quote'

  return (
    <div className="panel fade-in crm-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div>
          <span className="panel-title">CRM — HG Junk Removal</span>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.08em', marginTop: 2 }}>
            CUSTOMER RELATIONS MODULE · WEBSITE SYNC ACTIVE
          </p>
        </div>
        <Briefcase size={14} color="var(--accent-cyan)" />
      </div>

      <div className="panel-body" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="crm-stat-grid">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="crm-stat-card">
              <div className="crm-stat-card-glow" style={{ background: color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="crm-stat-label">{label}</p>
                  <p className="crm-stat-value" style={{ color }}>{value}</p>
                </div>
                <Icon size={18} color={color} style={{ opacity: 0.7 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn" onClick={() => openForm('lead')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={12} /> Add Lead
          </button>
          <button className="btn" onClick={() => openForm('customer')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={12} /> Add Customer
          </button>
          <button className="btn" onClick={() => openForm('quote')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={12} /> Add Quote
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {crmTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`btn ${crmTab === id ? 'active' : ''}`}
              onClick={() => setCrmTab(id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {stats.websiteLeads > 0 && (
          <div className="crm-website-banner fade-in">
            <span className="crm-website-pulse" />
            {stats.websiteLeads} website lead{stats.websiteLeads === 1 ? '' : 's'} synced from hgjunkremoval.com
          </div>
        )}

        <input
          className="input"
          placeholder="Search name, phone, email, address, service, or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Service</th>
                <th>Message</th>
                <th>Status</th>
                <th>Quote</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 24 }}>
                    No records in this category
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className={lead.source === 'website' ? 'crm-website-row' : undefined}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.03em' }}>
                          {lead.name}
                        </span>
                        {lead.source === 'website' && (
                          <span className="crm-website-badge">WEBSITE</span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{lead.phone}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.email || '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{lead.serviceNeeded}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 160 }} title={lead.message}>
                      {truncate(lead.message, 48)}
                    </td>
                    <td>
                      <span className="crm-status-badge" style={{ color: statusColors[lead.status], borderColor: statusColors[lead.status] }}>
                        {statusLabels[lead.status]}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', color: lead.quoteAmount > 0 ? 'var(--success)' : 'var(--text-dim)' }}>
                      {lead.quoteAmount > 0 ? formatCurrency(lead.quoteAmount) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn" onClick={() => openForm('edit', lead)} title="Edit" style={{ padding: '4px 8px' }}>
                          <Pencil size={12} />
                        </button>
                        <button className="btn btn-danger" onClick={() => removeLead(lead.id)} title="Delete" style={{ padding: '4px 8px' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {crmTab === 'revenue' && (
          <div className="crm-revenue-summary">
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--accent-cyan)', marginBottom: 8 }}>
              REVENUE BREAKDOWN
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div className="crm-revenue-item">
                <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Completed Jobs</span>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--success)' }}>
                  {formatCurrency(stats.revenue)}
                </span>
              </div>
              <div className="crm-revenue-item">
                <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Pending (Booked)</span>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-purple)' }}>
                  {formatCurrency(leads.filter((l) => l.status === 'booked').reduce((s, l) => s + l.quoteAmount, 0))}
                </span>
              </div>
              <div className="crm-revenue-item">
                <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Pipeline (Quoted)</span>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--warning)' }}>
                  {formatCurrency(leads.filter((l) => l.status === 'quoted').reduce((s, l) => s + l.quoteAmount, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {formMode && (
        <div className="crm-modal-overlay" onClick={closeForm}>
          <div className="crm-modal panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <span className="panel-title">{formTitles[formMode]}</span>
              <button className="btn" onClick={closeForm} style={{ padding: '4px 8px' }}>
                <X size={12} />
              </button>
            </div>
            <div className="panel-body" style={{ display: 'grid', gap: 10 }}>
              <label className="crm-field">
                <span className="crm-field-label">Name</span>
                <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Customer name" />
              </label>
              <label className="crm-field">
                <span className="crm-field-label">Phone</span>
                <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(503) 555-0100" />
              </label>
              <label className="crm-field">
                <span className="crm-field-label">Email</span>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="customer@email.com" />
              </label>
              <label className="crm-field">
                <span className="crm-field-label">Address</span>
                <input className="input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street address, city" />
              </label>
              <label className="crm-field">
                <span className="crm-field-label">Service Needed</span>
                <select className="input" value={form.serviceNeeded} onChange={(e) => setForm((f) => ({ ...f, serviceNeeded: e.target.value }))} style={{ cursor: 'pointer' }}>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="crm-field">
                <span className="crm-field-label">Message</span>
                <textarea className="input estimator-textarea" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Customer message or notes" rows={3} />
              </label>
              {showQuoteField && (
                <label className="crm-field">
                  <span className="crm-field-label">Quote Amount{quoteRequired ? ' *' : ''}</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.quoteAmount}
                    onChange={(e) => setForm((f) => ({ ...f, quoteAmount: e.target.value }))}
                    placeholder="0"
                  />
                </label>
              )}
              {showStatusField && (
                <label className="crm-field">
                  <span className="crm-field-label">Status</span>
                  <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LeadStatus }))} style={{ cursor: 'pointer' }}>
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                </label>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn active" onClick={handleSubmit} style={{ flex: 1 }}>
                  {formMode === 'edit' ? 'Save Changes' : 'Save'}
                </button>
                <button className="btn btn-danger" onClick={closeForm} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
