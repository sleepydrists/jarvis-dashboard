import { MessageSquare, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useOpenAIChat } from '../../hooks/useVoiceCommands'
import { useJarvisStore } from '../../store/useJarvisStore'

export function ChatPanel() {
  const messages = useJarvisStore((s) => s.messages)
  const isThinking = useJarvisStore((s) => s.isThinking)
  const { sendMessage } = useOpenAIChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isThinking) return
    setInput('')
    await sendMessage(text)
  }

  return (
    <div className="panel fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <span className="panel-title">Neural Comm Link</span>
        <MessageSquare size={14} color="var(--accent-cyan)" />
      </div>
      <div
        className="panel-body"
        style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: 2,
              fontSize: '0.85rem',
              lineHeight: 1.5,
              background:
                msg.role === 'user'
                  ? 'rgba(0,102,255,0.2)'
                  : msg.role === 'system'
                    ? 'rgba(0,212,255,0.08)'
                    : 'rgba(0,20,40,0.5)',
              border: `1px solid ${
                msg.role === 'user' ? 'rgba(0,102,255,0.3)' : 'rgba(0,212,255,0.15)'
              }`,
              color: msg.role === 'system' ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
          >
            {msg.role !== 'user' && (
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.15em',
                  color: 'var(--accent-cyan)',
                  marginBottom: 4,
                }}
              >
                {msg.role === 'system' ? 'SYSTEM' : 'JARVIS'}
              </span>
            )}
            {msg.content}
          </div>
        ))}
        {isThinking && (
          <div style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Processing neural response…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,212,255,0.15)', display: 'flex', gap: 8 }}>
        <input
          className="input"
          placeholder="Message JARVIS…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isThinking}
        />
        <button className="btn" onClick={handleSend} disabled={isThinking || !input.trim()} style={{ padding: '8px 12px' }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
