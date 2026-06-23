import { useEffect, useState } from 'react'
import { checkHealth } from '../../services/api'
import { useJarvisStore } from '../../store/useJarvisStore'

export function Header() {
  const isThinking = useJarvisStore((s) => s.isThinking)
  const voice = useJarvisStore((s) => s.voice)
  const [apiOnline, setApiOnline] = useState(false)

  useEffect(() => {
    checkHealth().then(setApiOnline)
    const id = setInterval(() => checkHealth().then(setApiOnline), 15000)
    return () => clearInterval(id)
  }, [])

  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        zIndex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
          {time}
        </span>
        {isThinking && (
          <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', animation: 'pulse 1.5s infinite' }}>
            NEURAL PROCESSING
          </span>
        )}
        {voice.listening && (
          <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>● VOICE ACTIVE</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`status-dot ${apiOnline ? 'online' : 'offline'}`} />
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          {apiOnline ? 'OPENAI LINKED' : 'API OFFLINE'}
        </span>
      </div>
    </header>
  )
}
