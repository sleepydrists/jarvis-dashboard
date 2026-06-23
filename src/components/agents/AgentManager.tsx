import { Bot, Plus, Trash2, Power } from 'lucide-react'
import { useState } from 'react'
import { useJarvisStore } from '../../store/useJarvisStore'
import type { AgentStatus } from '../../types'

const statusLabels: Record<AgentStatus, string> = {
  online: 'Online',
  idle: 'Idle',
  busy: 'Busy',
  offline: 'Offline',
}

export function AgentManager() {
  const { agents, addAgent, removeAgent, toggleAgentStatus } = useJarvisStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')

  const handleAdd = () => {
    if (!name.trim() || !role.trim()) return
    addAgent({ name: name.trim(), role: role.trim(), model, status: 'idle' })
    setName('')
    setRole('')
  }

  return (
    <div className="panel fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <span className="panel-title">Agent Management</span>
        <Bot size={14} color="var(--accent-cyan)" />
      </div>
      <div className="panel-body" style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <input className="input" placeholder="Agent name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Role / specialty" value={role} onChange={(e) => setRole(e.target.value)} />
          <select
            className="input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-4-turbo">gpt-4-turbo</option>
          </select>
          <button className="btn" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={14} /> Deploy Agent
          </button>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {agents.map((agent) => (
            <div
              key={agent.id}
              style={{
                padding: 14,
                background: 'rgba(0,20,40,0.4)',
                border: '1px solid rgba(0,212,255,0.15)',
                borderRadius: 2,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`status-dot ${agent.status}`} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                      {agent.name}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{agent.role}</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn" onClick={() => toggleAgentStatus(agent.id)} title="Toggle power" style={{ padding: '6px 8px' }}>
                    <Power size={12} />
                  </button>
                  <button className="btn btn-danger" onClick={() => removeAgent(agent.id)} title="Remove" style={{ padding: '6px 8px' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                <span>{agent.model}</span>
                <span>{statusLabels[agent.status]}</span>
                <span>{agent.tasksCompleted} tasks</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
