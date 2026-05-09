import { create } from 'zustand'

interface FogAlert { icao: string; rvr: number; ts: number }
interface FIRMSAlert { icao: string; hotspot: Record<string, unknown> }

interface AlertStore {
  fogAlerts: FogAlert[]
  firmsAlerts: FIRMSAlert[]
  addFogAlert: (a: FogAlert) => void
  addFIRMSAlert: (a: FIRMSAlert) => void
  clearOld: () => void
}

export const useAlertStore = create<AlertStore>((set) => ({
  fogAlerts: [],
  firmsAlerts: [],

  addFogAlert: (a) =>
    set((s) => ({ fogAlerts: [a, ...s.fogAlerts].slice(0, 20) })),

  addFIRMSAlert: (a) =>
    set((s) => ({ firmsAlerts: [a, ...s.firmsAlerts].slice(0, 20) })),

  clearOld: () => {
    const cutoff = Date.now() - 30 * 60 * 1000
    set((s) => ({ fogAlerts: s.fogAlerts.filter((a) => a.ts > cutoff) }))
  },
}))
