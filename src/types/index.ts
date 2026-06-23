export type AgentStatus = 'online' | 'idle' | 'offline' | 'busy'
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'
export type PanelId = 'overview' | 'agents' | 'tasks' | 'chat' | 'crm' | 'estimator' | 'quotes'
export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'booked' | 'completed'
export type CrmTab = 'leads' | 'quotes' | 'jobs' | 'revenue'
export type CrmFormMode = 'lead' | 'customer' | 'quote' | 'edit'

export type LeadSource = 'manual' | 'website'

export interface CRMLead {
  id: string
  name: string
  phone: string
  email: string
  address: string
  serviceNeeded: string
  message: string
  quoteAmount: number
  status: LeadStatus
  source: LeadSource
  createdAt: number
  quotedAt?: number
  bookedAt?: number
  completedAt?: number
}

export type CRMLeadInput = Omit<
  CRMLead,
  'id' | 'createdAt' | 'quotedAt' | 'bookedAt' | 'completedAt' | 'source'
>

export interface EstimateResult {
  quoteMin: number
  quoteMax: number
  laborHours: number
  truckLoads: number
  summary: string
  source: 'ai' | 'local'
}

export interface JunkEstimate {
  id: string
  serviceType: string
  description: string
  photos: string[]
  result: EstimateResult
  createdAt: number
}

export type EstimateInput = Pick<JunkEstimate, 'serviceType' | 'description' | 'photos'>

export type QuoteDecision = 'pending' | 'accepted' | 'declined'

export interface HGQuote {
  id: string
  quoteNumber: string
  customerName: string
  phone: string
  address: string
  service: string
  quoteAmount: number
  notes: string
  status: QuoteDecision
  createdAt: number
  updatedAt: number
}

export type QuoteInput = Pick<
  HGQuote,
  'customerName' | 'phone' | 'address' | 'service' | 'quoteAmount' | 'notes'
>

export interface Agent {
  id: string
  name: string
  role: string
  model: string
  status: AgentStatus
  tasksCompleted: number
}

export interface AutomationTask {
  id: string
  name: string
  trigger: string
  schedule: string
  status: TaskStatus
  lastRun: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface SystemMetrics {
  cpu: number
  memory: number
  network: number
  neuralLoad: number
}

export interface VoiceState {
  listening: boolean
  transcript: string
  lastCommand: string
  supported: boolean
}
