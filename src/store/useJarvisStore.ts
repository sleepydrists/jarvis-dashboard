import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Agent,
  AutomationTask,
  ChatMessage,
  CRMLead,
  CRMLeadInput,
  CrmTab,
  EstimateInput,
  HGQuote,
  JunkEstimate,
  PanelId,
  QuoteDecision,
  QuoteInput,
  SystemMetrics,
  VoiceState,
} from '../types'
import { defaultLeads, normalizeLead, withStatusTimestamps } from './crmDefaults'
import { generateQuoteNumber } from '../constants/services'
import { deleteWebsiteLead, fetchWebsiteLeads, patchWebsiteLead } from '../services/leads'

const defaultAgents: Agent[] = [
  {
    id: '1',
    name: 'ORION',
    role: 'Research Analyst',
    model: 'gpt-4o',
    status: 'online',
    tasksCompleted: 142,
  },
  {
    id: '2',
    name: 'NEXUS',
    role: 'Code Architect',
    model: 'gpt-4o-mini',
    status: 'busy',
    tasksCompleted: 89,
  },
  {
    id: '3',
    name: 'AEGIS',
    role: 'Security Monitor',
    model: 'gpt-4o-mini',
    status: 'idle',
    tasksCompleted: 56,
  },
  {
    id: '4',
    name: 'ECHO',
    role: 'Voice Interface',
    model: 'gpt-4o-mini',
    status: 'online',
    tasksCompleted: 203,
  },
]

const defaultTasks: AutomationTask[] = [
  {
    id: '1',
    name: 'Morning Briefing',
    trigger: 'Schedule: 08:00',
    schedule: 'Daily',
    status: 'completed',
    lastRun: '2h ago',
  },
  {
    id: '2',
    name: 'System Health Scan',
    trigger: 'Every 15 min',
    schedule: 'Interval',
    status: 'running',
    lastRun: 'Now',
  },
  {
    id: '3',
    name: 'Email Triage',
    trigger: 'On new mail',
    schedule: 'Event',
    status: 'pending',
    lastRun: '45m ago',
  },
  {
    id: '4',
    name: 'Neural Sync',
    trigger: 'Voice: "sync neural"',
    schedule: 'Manual',
    status: 'pending',
    lastRun: 'Never',
  },
]

interface JarvisState {
  activePanel: PanelId
  crmTab: CrmTab
  agents: Agent[]
  tasks: AutomationTask[]
  leads: CRMLead[]
  estimates: JunkEstimate[]
  quotes: HGQuote[]
  messages: ChatMessage[]
  metrics: SystemMetrics
  voice: VoiceState
  brainActivity: number
  isThinking: boolean
  setActivePanel: (panel: PanelId) => void
  setCrmTab: (tab: CrmTab) => void
  addLead: (lead: CRMLeadInput) => void
  updateLead: (id: string, updates: CRMLeadInput) => void
  removeLead: (id: string) => void
  syncWebsiteLeads: () => Promise<void>
  addEstimate: (input: EstimateInput, result: JunkEstimate['result']) => void
  removeEstimate: (id: string) => void
  addQuote: (input: QuoteInput) => HGQuote
  setQuoteStatus: (id: string, status: QuoteDecision) => void
  removeQuote: (id: string) => void
  addAgent: (agent: Omit<Agent, 'id' | 'tasksCompleted'>) => void
  removeAgent: (id: string) => void
  toggleAgentStatus: (id: string) => void
  addTask: (task: Omit<AutomationTask, 'id' | 'lastRun' | 'status'>) => void
  removeTask: (id: string) => void
  runTask: (id: string) => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setVoiceState: (partial: Partial<VoiceState>) => void
  setBrainActivity: (value: number) => void
  setIsThinking: (value: boolean) => void
  tickMetrics: () => void
}

type PersistedCrm = { leads?: unknown[]; crmTab?: CrmTab; estimates?: unknown[]; quotes?: unknown[] }

function hydrateLeads(raw: unknown[] | undefined): CRMLead[] {
  if (!raw?.length) return defaultLeads
  const leads = raw.map(normalizeLead).filter((l): l is CRMLead => l !== null)
  return leads.length ? leads : defaultLeads
}

function hydrateEstimates(raw: unknown[] | undefined): JunkEstimate[] {
  if (!raw?.length) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const e = item as Record<string, unknown>
      const result = e.result as Record<string, unknown> | undefined
      if (
        typeof e.id !== 'string' ||
        typeof e.serviceType !== 'string' ||
        typeof e.description !== 'string' ||
        !Array.isArray(e.photos) ||
        !result ||
        typeof result.quoteMin !== 'number' ||
        typeof result.quoteMax !== 'number'
      ) {
        return null
      }
      return {
        id: e.id,
        serviceType: e.serviceType,
        description: e.description,
        photos: e.photos.filter((p): p is string => typeof p === 'string'),
        result: {
          quoteMin: result.quoteMin,
          quoteMax: result.quoteMax,
          laborHours: typeof result.laborHours === 'number' ? result.laborHours : 2,
          truckLoads: typeof result.truckLoads === 'number' ? result.truckLoads : 1,
          summary: typeof result.summary === 'string' ? result.summary : '',
          source: result.source === 'ai' ? 'ai' : 'local',
        },
        createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
      } satisfies JunkEstimate
    })
    .filter((e): e is JunkEstimate => e !== null)
}

function hydrateQuotes(raw: unknown[] | undefined): HGQuote[] {
  if (!raw?.length) return []
  const valid: QuoteDecision[] = ['pending', 'accepted', 'declined']
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const q = item as Record<string, unknown>
      if (
        typeof q.id !== 'string' ||
        typeof q.customerName !== 'string' ||
        typeof q.quoteAmount !== 'number'
      ) {
        return null
      }
      const status = typeof q.status === 'string' && valid.includes(q.status as QuoteDecision)
        ? (q.status as QuoteDecision)
        : 'pending'
      return {
        id: q.id,
        quoteNumber: typeof q.quoteNumber === 'string' ? q.quoteNumber : generateQuoteNumber(1),
        customerName: q.customerName,
        phone: typeof q.phone === 'string' ? q.phone : '',
        address: typeof q.address === 'string' ? q.address : '',
        service: typeof q.service === 'string' ? q.service : '',
        quoteAmount: q.quoteAmount,
        notes: typeof q.notes === 'string' ? q.notes : '',
        status,
        createdAt: typeof q.createdAt === 'number' ? q.createdAt : Date.now(),
        updatedAt: typeof q.updatedAt === 'number' ? q.updatedAt : Date.now(),
      } satisfies HGQuote
    })
    .filter((q): q is HGQuote => q !== null)
}

export const useJarvisStore = create<JarvisState>()(
  persist(
    (set, get) => ({
      activePanel: 'overview',
      crmTab: 'leads',
      agents: defaultAgents,
      tasks: defaultTasks,
      leads: defaultLeads,
      estimates: [],
      quotes: [],
      messages: [
        {
          id: '0',
          role: 'system',
          content: 'JARVIS neural interface online. HG Junk Removal CRM systems nominal.',
          timestamp: Date.now(),
        },
      ],
      metrics: { cpu: 34, memory: 62, network: 48, neuralLoad: 71 },
      voice: {
        listening: false,
        transcript: '',
        lastCommand: '',
        supported:
          typeof window !== 'undefined' &&
          ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
      },
      brainActivity: 0.5,
      isThinking: false,

      setActivePanel: (panel) => set({ activePanel: panel }),

      setCrmTab: (tab) => set({ crmTab: tab }),

      addLead: (lead) =>
        set((s) => ({
          leads: [
            ...s.leads,
            {
              ...lead,
              email: lead.email ?? '',
              message: lead.message ?? '',
              source: 'manual',
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              ...withStatusTimestamps(undefined, lead),
            },
          ],
        })),

      updateLead: (id, updates) => {
        const existing = get().leads.find((l) => l.id === id)
        set((s) => ({
          leads: s.leads.map((l) => {
            if (l.id !== id) return l
            return {
              ...l,
              ...updates,
              ...withStatusTimestamps(l, updates),
            }
          }),
        }))
        if (existing?.source === 'website') {
          void patchWebsiteLead(id, updates)
        }
      },

      removeLead: (id) => {
        const existing = get().leads.find((l) => l.id === id)
        set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }))
        if (existing?.source === 'website') {
          void deleteWebsiteLead(id)
        }
      },

      syncWebsiteLeads: async () => {
        try {
          const websiteLeads = await fetchWebsiteLeads()
          set((s) => {
            const manual = s.leads.filter((l) => l.source !== 'website')
            return { leads: [...websiteLeads, ...manual] }
          })
        } catch {
          // API offline — keep local manual leads
        }
      },

      addEstimate: (input, result) =>
        set((s) => ({
          estimates: [
            {
              id: crypto.randomUUID(),
              serviceType: input.serviceType,
              description: input.description,
              photos: input.photos,
              result,
              createdAt: Date.now(),
            },
            ...s.estimates,
          ],
        })),

      removeEstimate: (id) =>
        set((s) => ({ estimates: s.estimates.filter((e) => e.id !== id) })),

      addQuote: (input) => {
        const ts = Date.now()
        const quote: HGQuote = {
          id: crypto.randomUUID(),
          quoteNumber: generateQuoteNumber(get().quotes.length + 1),
          ...input,
          status: 'pending',
          createdAt: ts,
          updatedAt: ts,
        }
        set((s) => ({ quotes: [quote, ...s.quotes] }))
        return quote
      },

      setQuoteStatus: (id, status) =>
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === id ? { ...q, status, updatedAt: Date.now() } : q,
          ),
        })),

      removeQuote: (id) =>
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),

      addAgent: (agent) =>
        set((s) => ({
          agents: [
            ...s.agents,
            { ...agent, id: crypto.randomUUID(), tasksCompleted: 0 },
          ],
        })),

      removeAgent: (id) =>
        set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),

      toggleAgentStatus: (id) =>
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id
              ? { ...a, status: a.status === 'online' ? 'offline' : 'online' }
              : a,
          ),
        })),

      addTask: (task) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              ...task,
              id: crypto.randomUUID(),
              status: 'pending',
              lastRun: 'Never',
            },
          ],
        })),

      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      runTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'running', lastRun: 'Now' } : t,
          ),
          brainActivity: 0.9,
        })),

      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
          ],
        })),

      setVoiceState: (partial) =>
        set((s) => ({ voice: { ...s.voice, ...partial } })),

      setBrainActivity: (value) => set({ brainActivity: value }),

      setIsThinking: (value) => set({ isThinking: value }),

      tickMetrics: () => {
        const { metrics } = get()
        set({
          metrics: {
            cpu: clamp(metrics.cpu + rand(-3, 3), 15, 95),
            memory: clamp(metrics.memory + rand(-2, 2), 30, 90),
            network: clamp(metrics.network + rand(-5, 5), 10, 99),
            neuralLoad: clamp(metrics.neuralLoad + rand(-4, 4), 20, 98),
          },
        })
      },
    }),
    {
      name: 'hg-junk-crm',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        leads: state.leads,
        crmTab: state.crmTab,
        estimates: state.estimates,
        quotes: state.quotes,
      }),
      merge: (persisted, current) => {
        const saved = persisted as PersistedCrm | undefined
        return {
          ...current,
          crmTab: saved?.crmTab ?? current.crmTab,
          leads: hydrateLeads(saved?.leads),
          estimates: hydrateEstimates(saved?.estimates) ?? current.estimates,
          quotes: hydrateQuotes(saved?.quotes) ?? current.quotes,
        }
      },
      version: 4,
      migrate: (persisted) => {
        const saved = persisted as PersistedCrm
        return {
          leads: hydrateLeads(saved?.leads),
          crmTab: saved?.crmTab ?? 'leads',
          estimates: hydrateEstimates(saved?.estimates),
          quotes: hydrateQuotes(saved?.quotes),
        }
      },
    },
  ),
)

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
