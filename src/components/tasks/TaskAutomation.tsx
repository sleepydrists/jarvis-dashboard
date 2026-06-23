import { Play, Plus, Trash2, Zap } from 'lucide-react'
import { useState } from 'react'
import { useJarvisStore } from '../../store/useJarvisStore'
import type { TaskStatus } from '../../types'

const statusColors: Record<TaskStatus, string> = {
  pending: 'var(--text-dim)',
  running: 'var(--accent-cyan)',
  completed: 'var(--success)',
  failed: 'var(--danger)',
}

export function TaskAutomation() {
  const { tasks, addTask, removeTask, runTask } = useJarvisStore()
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState('')
  const [schedule, setSchedule] = useState('Manual')

  const handleAdd = () => {
    if (!name.trim() || !trigger.trim()) return
    addTask({ name: name.trim(), trigger: trigger.trim(), schedule })
    setName('')
    setTrigger('')
  }

  return (
    <div className="panel fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <span className="panel-title">Task Automation</span>
        <Zap size={14} color="var(--accent-cyan)" />
      </div>
      <div className="panel-body" style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <input className="input" placeholder="Task name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Trigger (e.g. Schedule: 08:00)" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
          <select className="input" value={schedule} onChange={(e) => setSchedule(e.target.value)} style={{ cursor: 'pointer' }}>
            <option>Manual</option>
            <option>Daily</option>
            <option>Interval</option>
            <option>Event</option>
          </select>
          <button className="btn" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={14} /> Create Task
          </button>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: 14,
                background: 'rgba(0,20,40,0.4)',
                border: `1px solid ${task.status === 'running' ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.15)'}`,
                borderRadius: 2,
                boxShadow: task.status === 'running' ? 'var(--glow-cyan)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>{task.name}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{task.trigger}</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn"
                    onClick={() => runTask(task.id)}
                    disabled={task.status === 'running'}
                    style={{ padding: '6px 8px' }}
                  >
                    <Play size={12} />
                  </button>
                  <button className="btn btn-danger" onClick={() => removeTask(task.id)} style={{ padding: '6px 8px' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                <span>{task.schedule}</span>
                <span style={{ color: statusColors[task.status], textTransform: 'uppercase' }}>{task.status}</span>
                <span>Last: {task.lastRun}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
