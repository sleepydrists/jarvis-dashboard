import { Mic, MicOff, Volume2 } from 'lucide-react'
import { useVoiceCommands } from '../../hooks/useVoiceCommands'
import { useJarvisStore } from '../../store/useJarvisStore'

export function VoicePanel() {
  const voice = useJarvisStore((s) => s.voice)
  const { toggleListening, supported } = useVoiceCommands()

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <span className="panel-title">Voice Interface</span>
        <Volume2 size={14} color="var(--accent-cyan)" />
      </div>
      <div className="panel-body" style={{ textAlign: 'center' }}>
        <button
          className={`btn ${voice.listening ? 'active' : ''}`}
          onClick={toggleListening}
          disabled={!supported}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            padding: 0,
          }}
        >
          {voice.listening ? <Mic size={28} /> : <MicOff size={28} />}
        </button>

        <p style={{ fontSize: '0.8rem', color: voice.listening ? 'var(--accent-cyan)' : 'var(--text-muted)', marginBottom: 12 }}>
          {voice.listening ? 'Listening…' : supported ? 'Tap to activate' : 'Speech API unavailable'}
        </p>

        {voice.transcript && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: 8 }}>
            "{voice.transcript}"
          </p>
        )}

        {voice.lastCommand && (
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            Last: {voice.lastCommand}
          </p>
        )}

        <div style={{ marginTop: 16, textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Voice commands:</p>
          <p>"Status report" · "Open agents"</p>
          <p>"Run scan" · "Sync neural"</p>
          <p>"Open chat" · "Stand down"</p>
        </div>
      </div>
    </div>
  )
}
