import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { AircraftState } from '../../../shared/src/index'
import { useAlertStore } from '../store/alertStore'

export function useLiveStates() {
  const socketRef = useRef<Socket | null>(null)
  const statesMap = useRef(new Map<string, AircraftState>())
  const [states, setStates] = useState<AircraftState[]>([])
  const addFogAlert = useAlertStore((s) => s.addFogAlert)
  const addFIRMSAlert = useAlertStore((s) => s.addFIRMSAlert)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
    socketRef.current = io(apiUrl, { transports: ['websocket', 'polling'] })

    const socket = socketRef.current

    socket.on('states:init', (data: AircraftState[]) => {
      data.forEach((s) => statesMap.current.set(s.icao24, s))
      setStates([...statesMap.current.values()])
    })

    socket.on('states', (data: AircraftState[]) => {
      data.forEach((s) => statesMap.current.set(s.icao24, s))
      // Remove stale (no update for > 2 min)
      const cutoff = Date.now() - 120_000
      for (const [k, v] of statesMap.current.entries()) {
        if (new Date(v.timestamp).getTime() < cutoff) statesMap.current.delete(k)
      }
      setStates([...statesMap.current.values()])
    })

    socket.on('alert:fog', addFogAlert)
    socket.on('alert:firms', addFIRMSAlert)

    return () => {
      socket.disconnect()
    }
  }, [addFogAlert, addFIRMSAlert])

  return { states, socket: socketRef.current }
}
