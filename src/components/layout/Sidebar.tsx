import { LayoutDashboard, Bot, Zap, MessageSquare, Users, Sparkles, FileText } from 'lucide-react'
import { useJarvisStore } from '../../store/useJarvisStore'
import type { PanelId } from '../../types'

const nav: { id: PanelId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'estimator', label: 'Estimator', icon: Sparkles },
  { id: 'quotes', label: 'Quotes', icon: FileText },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'tasks', label: 'Tasks', icon: Zap },
  { id: 'chat', label: 'Comm Link', icon: MessageSquare },
]

export function Sidebar() {
  const { activePanel, setActivePanel, agents, tasks, leads, estimates, quotes } = useJarvisStore()
  const onlineAgents = agents.filter((a) => a.status === 'online' || a.status === 'busy').length
  const runningTasks = tasks.filter((t) => t.status === 'running').length
  const activeLeads = leads.filter((l) => ['new', 'contacted', 'quoted'].includes(l.status)).length

  return (
    <aside
      style={{
        width: 220,
        padding: '20px 12px',
        borderRight: '1px solid rgba(0,212,255,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        zIndex: 1,
      }}
    >
      <div style={{ padding: '0 8px 20px', borderBottom: '1px solid rgba(0,212,255,0.1)', marginBottom: 12 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.95rem',
            letterSpacing: '0.15em',
            color: 'var(--accent-cyan)',
            textShadow: 'var(--glow-cyan)',
          }}
        >
          HG JUNK
        </h1>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em', marginTop: 4 }}>
          JARVIS CRM v1.0
        </p>
      </div>

      {nav.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`btn ${activePanel === id ? 'active' : ''}`}
          onClick={() => setActivePanel(id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'flex-start',
            width: '100%',
            background: activePanel === id ? 'rgba(0,212,255,0.15)' : 'transparent',
            border: activePanel === id ? '1px solid var(--accent-cyan)' : '1px solid transparent',
          }}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}

      <div style={{ marginTop: 'auto', padding: 12, fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
        <p>Quotes: <span style={{ color: 'var(--accent-cyan)' }}>{quotes.length}</span></p>
        <p>Estimates: <span style={{ color: 'var(--accent-purple)' }}>{estimates.length}</span></p>
        <p>CRM leads: <span style={{ color: 'var(--warning)' }}>{activeLeads}</span></p>
        <p>Agents: <span style={{ color: 'var(--success)' }}>{onlineAgents}</span>/{agents.length}</p>
        <p>Tasks running: <span style={{ color: 'var(--accent-cyan)' }}>{runningTasks}</span></p>
      </div>
    </aside>
  )
}
