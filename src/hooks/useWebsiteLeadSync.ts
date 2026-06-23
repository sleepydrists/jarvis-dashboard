import { useEffect } from 'react'
import { useJarvisStore } from '../store/useJarvisStore'

const POLL_MS = 3000

export function useWebsiteLeadSync() {
  const syncWebsiteLeads = useJarvisStore((s) => s.syncWebsiteLeads)

  useEffect(() => {
    syncWebsiteLeads()
    const id = setInterval(syncWebsiteLeads, POLL_MS)
    return () => clearInterval(id)
  }, [syncWebsiteLeads])
}
