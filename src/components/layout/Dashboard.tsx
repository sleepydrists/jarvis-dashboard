import { QuotesPanel } from '../quotes/QuotesPanel'
import { EstimatorPanel } from '../estimator/EstimatorPanel'
import { CrmPanel } from '../crm/CrmPanel'
import { AgentManager } from '../agents/AgentManager'
import { NeuralBrain } from '../brain/NeuralBrain'
import { ChatPanel } from '../chat/ChatPanel'
import { SystemMetrics } from '../hud/SystemMetrics'
import { Header } from '../layout/Header'
import { Sidebar } from '../layout/Sidebar'
import { TaskAutomation } from '../tasks/TaskAutomation'
import { VoicePanel } from '../voice/VoicePanel'
import { useJarvisStore } from '../../store/useJarvisStore'
import { useWebsiteLeadSync } from '../../hooks/useWebsiteLeadSync'

export function Dashboard() {
  const activePanel = useJarvisStore((s) => s.activePanel)
  useWebsiteLeadSync()

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="scanlines" />
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activePanel === 'overview' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '280px 1fr 280px',
                gridTemplateRows: '1fr',
                gap: 16,
                flex: 1,
                minHeight: 0,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <VoicePanel />
                <SystemMetrics />
              </div>
              <div className="panel" style={{ overflow: 'hidden', position: 'relative' }}>
                <div className="panel-header">
                  <span className="panel-title">Neural Core Visualization</span>
                </div>
                <div style={{ height: 'calc(100% - 45px)' }}>
                  <NeuralBrain />
                </div>
              </div>
              <ChatPanel />
            </div>
          )}

          {activePanel === 'crm' && <CrmPanel />}
          {activePanel === 'estimator' && <EstimatorPanel />}
          {activePanel === 'quotes' && <QuotesPanel />}
          {activePanel === 'agents' && <AgentManager />}
          {activePanel === 'tasks' && <TaskAutomation />}
          {activePanel === 'chat' && <ChatPanel />}
        </main>
      </div>
    </div>
  )
}
