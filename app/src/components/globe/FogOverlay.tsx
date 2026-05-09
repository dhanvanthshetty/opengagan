// FogOverlay.tsx
// Listens to fog alerts from alertStore and provides ring data
// and a StatusBar notification for fog conditions

import React, { memo } from 'react'
import { useAlertStore } from '../../store/alertStore'

interface FogBanner {
  icao: string
  rvr: number
  ts: number
}

export const FogOverlay = memo(function FogOverlay() {
  const fogAlerts = useAlertStore((s) => s.fogAlerts)

  if (fogAlerts.length === 0) return null

  const latest = fogAlerts[0]
  const isSevere = latest.rvr < 200
  const age = Math.round((Date.now() - latest.ts) / 60_000)

  return (
    <div
      className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md text-sm font-medium transition-all"
      style={
        isSevere
          ? {
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#dc2626',
              boxShadow: '0 4px 16px rgba(239,68,68,0.12)',
            }
          : {
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.35)',
              color: '#b45309',
              boxShadow: '0 4px 16px rgba(245,158,11,0.10)',
            }
      }
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ background: isSevere ? '#ef4444' : '#f59e0b' }}
      />
      <span>
        {isSevere ? 'Dense fog' : 'Mist/Haze'} at {latest.icao}
        {' '}— RVR {latest.rvr}m
        {age > 0 ? ` (${age}m ago)` : ' (just now)'}
      </span>
      {isSevere && (
        <span
          className="text-xs rounded px-1.5 py-0.5"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#dc2626' }}
        >
          CAT III ops
        </span>
      )}
    </div>
  )
})

// Helper: convert fog alert to ring descriptor for react-globe.gl ringsData
export function fogAlertToRing(
  alert: FogBanner,
  lat: number,
  lon: number
): Record<string, unknown> {
  const severe = alert.rvr < 200
  return {
    lat,
    lng: lon,
    maxR: severe ? 2.5 : 1.5,
    propagationSpeed: severe ? 2.5 : 1.2,
    repeatPeriod: severe ? 1000 : 2000,
    color: () => severe ? 'rgba(239,68,68,0.75)' : 'rgba(251,191,36,0.65)',
  }
}
