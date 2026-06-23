import {
  Briefcase,
  Clock,
  History,
  Loader2,
  Sparkles,
  Trash2,
  Truck,
  Upload,
  X,
  DollarSign,
} from 'lucide-react'
import { useRef, useState } from 'react'
import {
  ESTIMATOR_SERVICES,
  compressPhoto,
  formatQuoteRange,
  generateEstimate,
} from '../../services/estimate'
import { useJarvisStore } from '../../store/useJarvisStore'
import type { EstimateResult, JunkEstimate } from '../../types'

const MAX_PHOTOS = 6

function ResultCard({ result }: { result: EstimateResult }) {
  const metrics = [
    { label: 'Quote Range', value: formatQuoteRange(result.quoteMin, result.quoteMax), icon: DollarSign, color: 'var(--success)' },
    { label: 'Labor Hours', value: `${result.laborHours} hrs`, icon: Clock, color: 'var(--accent-cyan)' },
    { label: 'Truck Loads', value: String(result.truckLoads), icon: Truck, color: 'var(--accent-purple)' },
  ]

  return (
    <div className="estimator-result-card fade-in">
      <div className="estimator-result-glow" />
      <div className="estimator-result-header">
        <Sparkles size={16} color="var(--accent-cyan)" />
        <span className="panel-title">AI Estimate Complete</span>
        <span className="estimator-source-badge">{result.source === 'ai' ? 'NEURAL AI' : 'LOCAL ENGINE'}</span>
      </div>
      <div className="estimator-result-grid">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="estimator-metric">
            <Icon size={14} color={color} />
            <span className="estimator-metric-label">{label}</span>
            <span className="estimator-metric-value" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
      {result.summary && (
        <p className="estimator-summary">{result.summary}</p>
      )}
    </div>
  )
}

function HistoryItem({
  estimate,
  onSelect,
  onDelete,
  active,
}: {
  estimate: JunkEstimate
  onSelect: () => void
  onDelete: () => void
  active: boolean
}) {
  const date = new Date(estimate.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
        <p className="estimator-history-title">{estimate.serviceType}</p>
        <p className="estimator-history-meta">{date}</p>
        <p className="estimator-history-range">
          {formatQuoteRange(estimate.result.quoteMin, estimate.result.quoteMax)}
        </p>
      </div>
      {estimate.photos[0] && (
        <img src={estimate.photos[0]} alt="" className="estimator-history-thumb" />
      )}
      <button
        className="btn btn-danger"
        style={{ padding: '4px 6px' }}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Delete estimate"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

export function EstimatorPanel() {
  const { estimates, addEstimate, removeEstimate, setBrainActivity } = useJarvisStore()

  const fileRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [serviceType, setServiceType] = useState(ESTIMATOR_SERVICES[0])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<EstimateResult | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const selectedEstimate = estimates.find((e) => e.id === selectedId)

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) return

    const toAdd = Array.from(files).slice(0, remaining)
    try {
      const compressed = await Promise.all(toAdd.map(compressPhoto))
      setPhotos((prev) => [...prev, ...compressed].slice(0, MAX_PHOTOS))
    } catch {
      setError('Failed to process one or more photos.')
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please add a job description.')
      return
    }
    setError('')
    setLoading(true)
    setBrainActivity(0.9)

    const input = {
      serviceType,
      description: description.trim(),
      photos,
    }

    try {
      const result = await generateEstimate(input)
      setCurrentResult(result)
      addEstimate(input, result)
      setSelectedId(null)
    } catch {
      setError('Estimate failed. Please try again.')
    } finally {
      setLoading(false)
      setBrainActivity(0.5)
    }
  }

  const selectHistory = (estimate: JunkEstimate) => {
    setSelectedId(estimate.id)
    setCurrentResult(estimate.result)
    setServiceType(estimate.serviceType)
    setDescription(estimate.description)
    setPhotos(estimate.photos)
  }

  const clearForm = () => {
    setPhotos([])
    setDescription('')
    setCurrentResult(null)
    setSelectedId(null)
    setError('')
  }

  return (
    <div className="panel fade-in estimator-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div>
          <span className="panel-title">AI Estimator — HG Junk Removal</span>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.08em', marginTop: 2 }}>
            NEURAL PRICING MODULE
          </p>
        </div>
        <Sparkles size={14} color="var(--accent-cyan)" />
      </div>

      <div className="estimator-layout panel-body">
        <div className="estimator-form-col">
          <div className="estimator-section">
            <span className="crm-field-label">Upload Photos</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <div
              className="estimator-upload-zone"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleFiles(e.dataTransfer.files)
              }}
            >
              <Upload size={22} color="var(--accent-cyan)" />
              <p>Drop photos here or click to upload</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Up to {MAX_PHOTOS} images</p>
            </div>
            {photos.length > 0 && (
              <div className="estimator-photo-grid">
                {photos.map((src, i) => (
                  <div key={i} className="estimator-photo-thumb">
                    <img src={src} alt={`Upload ${i + 1}`} />
                    <button className="estimator-photo-remove" onClick={() => removePhoto(i)} type="button">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="crm-field">
            <span className="crm-field-label">Service Type</span>
            <select
              className="input"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {ESTIMATOR_SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="crm-field">
            <span className="crm-field-label">Description</span>
            <textarea
              className="input estimator-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the junk, access constraints, volume, stairs, etc."
              rows={4}
            />
          </label>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn active"
              onClick={handleSubmit}
              disabled={loading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? <Loader2 size={14} className="estimator-spin" /> : <Sparkles size={14} />}
              {loading ? 'Analyzing…' : 'Generate Estimate'}
            </button>
            <button className="btn" onClick={clearForm} disabled={loading}>
              Clear
            </button>
          </div>

          {currentResult && <ResultCard result={currentResult} />}
        </div>

        <div className="estimator-history-col">
          <div className="estimator-history-header">
            <History size={14} color="var(--accent-cyan)" />
            <span className="panel-title">Estimate History</span>
            <span className="estimator-history-count">{estimates.length}</span>
          </div>
          <div className="estimator-history-list">
            {estimates.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: 24 }}>
                No saved estimates yet
              </p>
            ) : (
              estimates.map((estimate) => (
                <HistoryItem
                  key={estimate.id}
                  estimate={estimate}
                  active={selectedId === estimate.id}
                  onSelect={() => selectHistory(estimate)}
                  onDelete={() => {
                    removeEstimate(estimate.id)
                    if (selectedId === estimate.id) {
                      setSelectedId(null)
                      setCurrentResult(null)
                    }
                  }}
                />
              ))
            )}
          </div>
          {selectedEstimate && (
            <div className="estimator-history-detail">
              <Briefcase size={12} color="var(--text-dim)" />
              <p>{selectedEstimate.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
