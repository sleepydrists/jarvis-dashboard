import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react'
import { useEffect } from 'react'
import { useJarvisStore } from '../../store/useJarvisStore'

const metrics = [
  { key: 'cpu' as const, label: 'CPU', icon: Cpu, color: '#00d4ff' },
  { key: 'memory' as const, label: 'MEM', icon: HardDrive, color: '#0066ff' },
  { key: 'network' as const, label: 'NET', icon: Wifi, color: '#7b61ff' },
  { key: 'neuralLoad' as const, label: 'NEURAL', icon: Activity, color: '#00ff88' },
]

export function SystemMetrics() {
  const { metrics: data, tickMetrics } = useJarvisStore()

  useEffect(() => {
    const id = setInterval(tickMetrics, 3000)
    return () => clearInterval(id)
  }, [tickMetrics])

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <span className="panel-title">System Metrics</span>
      </div>
      <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
        {metrics.map(({ key, label, icon: Icon, color }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Icon size={14} color={color} />
                {label}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color }}>{data[key]}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(0,20,40,0.6)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${data[key]}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  boxShadow: `0 0 8px ${color}66`,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
