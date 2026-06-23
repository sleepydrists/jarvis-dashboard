import { useCallback, useEffect, useRef } from 'react'
import { useJarvisStore } from '../store/useJarvisStore'
import type { PanelId } from '../types'

const COMMANDS: { patterns: RegExp[]; action: string; panel?: PanelId }[] = [
  { patterns: [/open quotes/i, /show quotes/i, /quote generator/i, /generate quote/i], action: 'Opening quote generator.', panel: 'quotes' },
  { patterns: [/open estimator/i, /show estimator/i, /estimate/i, /pricing/i], action: 'Opening AI estimator.', panel: 'estimator' },
  { patterns: [/open crm/i, /show crm/i, /customer/i, /leads?/i], action: 'Opening CRM module.', panel: 'crm' },
  { patterns: [/open agents?/i, /show agents?/i, /agent panel/i], action: 'Opening agent management.', panel: 'agents' },
  { patterns: [/open tasks?/i, /show tasks?/i, /automation/i], action: 'Opening task automation.', panel: 'tasks' },
  { patterns: [/open chat/i, /talk to jarvis/i, /open comm/i], action: 'Opening communications.', panel: 'chat' },
  { patterns: [/overview/i, /home/i, /main screen/i], action: 'Returning to overview.', panel: 'overview' },
  { patterns: [/status report/i, /system status/i], action: 'status' },
  { patterns: [/run scan/i, /health scan/i], action: 'scan' },
  { patterns: [/sync neural/i, /neural sync/i], action: 'sync' },
  { patterns: [/stop listening/i, /stand down/i], action: 'stop' },
]

function getRecognition(): SpeechRecognition | null {
  const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
  if (!SR) return null
  return new SR()
}

export function useVoiceCommands() {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const {
    voice,
    setVoiceState,
    setActivePanel,
    addMessage,
    runTask,
    tasks,
    setBrainActivity,
    tickMetrics,
  } = useJarvisStore()

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 0.85
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(
      (v) => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.lang.startsWith('en'),
    )
    if (preferred) utterance.voice = preferred
    window.speechSynthesis.speak(utterance)
  }, [])

  const stopListeningRef = useRef<() => void>(() => {})

  const handleCommand = useCallback(
    (transcript: string) => {
      const text = transcript.trim().toLowerCase()
      setVoiceState({ lastCommand: transcript, transcript: '' })

      for (const cmd of COMMANDS) {
        if (cmd.patterns.some((p) => p.test(text))) {
          if (cmd.panel) setActivePanel(cmd.panel)
          if (cmd.action === 'status') {
            const { leads, agents } = useJarvisStore.getState()
            const activeLeads = leads.filter((l) => ['new', 'contacted', 'quoted'].includes(l.status)).length
            const jobsBooked = leads.filter((l) => l.status === 'booked').length
            const onlineAgents = agents.filter((a) => a.status === 'online' || a.status === 'busy').length
            const msg = `All systems operational. ${activeLeads} active CRM leads, ${jobsBooked} jobs booked. ${onlineAgents} agents online.`
            addMessage({ role: 'assistant', content: msg })
            speak(msg)
            tickMetrics()
            return
          }
          if (cmd.action === 'scan') {
            const scanTask = tasks.find((t) => t.name.includes('Health'))
            if (scanTask) runTask(scanTask.id)
            speak('Initiating system health scan.')
            setBrainActivity(0.95)
            return
          }
          if (cmd.action === 'sync') {
            const syncTask = tasks.find((t) => t.name.includes('Neural'))
            if (syncTask) runTask(syncTask.id)
            speak('Neural synchronization initiated.')
            setBrainActivity(1)
            return
          }
          if (cmd.action === 'stop') {
            stopListeningRef.current()
            speak('Voice interface deactivated.')
            return
          }
          speak(cmd.action)
          return
        }
      }

      addMessage({ role: 'user', content: transcript })
      speak(`Command noted: ${transcript}`)
    },
    [addMessage, runTask, setActivePanel, setBrainActivity, setVoiceState, speak, tasks, tickMetrics],
  )

  const startListening = useCallback(() => {
    const rec = getRecognition()
    if (!rec) return

    recognitionRef.current = rec
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) final += result[0].transcript
        else interim += result[0].transcript
      }
      setVoiceState({ transcript: interim || final })
      if (final) handleCommand(final)
    }

    rec.onerror = () => setVoiceState({ listening: false })
    rec.onend = () => {
      if (useJarvisStore.getState().voice.listening) {
        try {
          rec.start()
        } catch {
          setVoiceState({ listening: false })
        }
      }
    }

    rec.start()
    setVoiceState({ listening: true })
    speak('JARVIS online. Awaiting your command.')
  }, [handleCommand, setVoiceState, speak])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setVoiceState({ listening: false, transcript: '' })
  }, [setVoiceState])

  stopListeningRef.current = stopListening

  const toggleListening = useCallback(() => {
    if (voice.listening) stopListening()
    else startListening()
  }, [voice.listening, startListening, stopListening])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  return { speak, startListening, stopListening, toggleListening, supported: voice.supported }
}

export function useOpenAIChat() {
  const { messages, addMessage, setIsThinking, setBrainActivity } = useJarvisStore()

  const sendMessage = useCallback(
    async (content: string) => {
      addMessage({ role: 'user', content })
      setIsThinking(true)
      setBrainActivity(0.85)

      try {
        const { sendChatMessage } = await import('../services/api')
        const history = messages
          .filter((m) => m.role !== 'system')
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }))
        history.push({ role: 'user', content })

        const reply = await sendChatMessage([
          {
            role: 'system',
            content:
              'You are JARVIS, a futuristic AI assistant. Respond concisely in a calm, intelligent tone. Use technical but accessible language. Keep responses under 120 words unless asked for detail.',
          },
          ...history,
        ])

        addMessage({ role: 'assistant', content: reply })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed'
        addMessage({
          role: 'assistant',
          content: `Neural link error: ${msg}. Ensure the API server is running and OPENAI_API_KEY is set.`,
        })
      } finally {
        setIsThinking(false)
        setBrainActivity(0.5)
      }
    },
    [addMessage, messages, setBrainActivity, setIsThinking],
  )

  return { sendMessage }
}
