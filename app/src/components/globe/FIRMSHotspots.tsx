// FIRMSHotspots.tsx
// Fetches FIRMS fire hotspots and renders pulsing yellow/red rings near airports

import React, { memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

export interface FIRMSPoint {
  latitude: number
  longitude: number
  confidence: string
  nearAirportIcao?: string
  nearAirportDistanceKm?: number
}

export function useFIRMSData() {
  return useQuery<FIRMSPoint[]>({
    queryKey: ['firms'],
    queryFn: () =>
      api
        .get<FIRMSPoint[]>('/firms', {
          params: { bbox: '6.5,68,37,97.5' },
        })
        .then((r) => r.data),
    staleTime: 30 * 60 * 1000,  // 30 min — same as server poll
    retry: 1,
  })
}

// Convert FIRMS point to ring descriptor for react-globe.gl
export function firmsToRing(point: FIRMSPoint): Record<string, unknown> {
  const isHigh = point.confidence?.toLowerCase() === 'high'
  const isNearAirport = Boolean(point.nearAirportIcao && (point.nearAirportDistanceKm ?? 999) < 50)
  const isCritical = isHigh && isNearAirport

  return {
    lat: point.latitude,
    lng: point.longitude,
    maxR: isCritical ? 2.5 : 1.5,
    propagationSpeed: isCritical ? 2 : 1,
    repeatPeriod: isCritical ? 1500 : 3000,
    color: () => isCritical
      ? 'rgba(239,68,68,0.7)'
      : 'rgba(251,191,36,0.5)',
  }
}

// Build all FIRMS ring data for the globe
export function buildFIRMSRings(hotspots: FIRMSPoint[]): Record<string, unknown>[] {
  return hotspots.map(firmsToRing)
}

export const FIRMSLegend = memo(function FIRMSLegend({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div
      className="absolute bottom-20 right-4 z-10 rounded-xl px-4 py-3 text-xs backdrop-blur-sm"
      style={{
        background: 'rgba(245,242,232,0.95)',
        border: '1px solid rgba(26,37,64,0.12)',
        boxShadow: '0 4px 16px rgba(26,37,64,0.10)',
        color: '#1a2540',
      }}
    >
      <div className="font-semibold mb-2" style={{ color: '#1a2540' }}>NASA FIRMS</div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span style={{ color: '#2d3d5c' }}>Active fire detections</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span style={{ color: '#2d3d5c' }}>Near airport (&lt;50km)</span>
      </div>
      <div className="mt-2" style={{ color: 'rgba(26,37,64,0.45)' }}>{count} hotspots · 24h VIIRS</div>
    </div>
  )
})
