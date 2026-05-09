// CarbonPlume.tsx
// Animated CO2 trail using deck.gl TripsLayer
// Positioned as an absolute overlay on the globe

import React, { useEffect, useRef, useState, memo } from 'react'
import { buildGreatCirclePath, buildTimestamps } from '../../lib/greatCircle'

interface RoutePoint { lat: number; lng: number }

interface CarbonPlumeProps {
  origin: RoutePoint
  dest: RoutePoint
  co2Kg: number
  active: boolean
}

// We implement the animation using canvas directly to avoid DeckGL version conflicts.
// A simple animated dashed line along the great circle path drawn on a canvas overlay.
export const CarbonPlume = memo(function CarbonPlume({ origin, dest, co2Kg, active }: CarbonPlumeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return

    const path = buildGreatCirclePath(origin, dest, 64)
    let p = 0

    const tick = () => {
      p = (p + 1) % 100
      setPhase(p)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [active, origin, dest])

  if (!active) return null

  // Visual indicator — a small animating badge showing the CO2 info
  // The actual route line is handled by react-globe.gl arcsData
  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
      style={{ animation: 'none' }}
    >
      <div
        className="bg-orange-500/20 border border-orange-500/40 rounded-xl px-4 py-3 text-center backdrop-blur-sm"
        style={{ opacity: 0.7 + (Math.sin(phase * 0.2) * 0.3) }}
      >
        <div className="text-orange-300 text-2xl font-bold">{co2Kg} kg CO₂</div>
        <div className="text-orange-400/70 text-xs mt-0.5">Carbon trail active</div>
      </div>
    </div>
  )
})

// Build carbon arc props for react-globe.gl
export function buildCarbonArcProps(origin: RoutePoint, dest: RoutePoint, co2Kg: number) {
  const intensity = Math.min(1, co2Kg / 500)
  const r = Math.round(255 * intensity)
  const g = Math.round(140 * (1 - intensity * 0.5))

  return {
    arcsData: [{
      startLat: origin.lat,
      startLng: origin.lng,
      endLat: dest.lat,
      endLng: dest.lng,
      co2Kg,
    }],
    arcStartLat: 'startLat',
    arcStartLng: 'startLng',
    arcEndLat: 'endLat',
    arcEndLng: 'endLng',
    arcColor: () => [`rgba(${r},${g},0,0.9)`, `rgba(${r},${g},0,0.3)`],
    arcStroke: 2,
    arcAltitude: 0.4,
    arcDashLength: 0.4,
    arcDashGap: 0.2,
    arcDashAnimateTime: 2000,
    arcCurveResolution: 64,
  }
}
