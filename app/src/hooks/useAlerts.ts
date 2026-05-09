import { useAlertStore } from '../store/alertStore'

export function useAlerts() {
  const fogAlerts = useAlertStore((s) => s.fogAlerts)
  const firmsAlerts = useAlertStore((s) => s.firmsAlerts)
  return { fogAlerts, firmsAlerts }
}
