// RouteArcs.tsx
// Renders UDAN route arcs using deck.gl ArcLayer overlaid on the globe
// NOTE: deck.gl integration with react-globe.gl is tricky — we use a simpler
// approach via globe.gl's arcsData prop instead of a separate DeckGL canvas

import React, { memo } from 'react'

export interface RouteArc {
  originLat: number
  originLon: number
  destLat: number
  destLon: number
  passengers: number
  isUdan: boolean
  originIata: string
  destIata: string
}

// Color arrays for react-globe.gl arcsData
export function arcColor(arc: RouteArc, end: 'start' | 'end'): string {
  if (arc.isUdan) {
    return end === 'start' ? 'rgba(251,146,60,0.9)' : 'rgba(239,68,68,0.9)'
  }
  return end === 'start' ? 'rgba(96,165,250,0.7)' : 'rgba(139,92,246,0.7)'
}

export function arcWidth(arc: RouteArc): number {
  return Math.max(0.5, Math.log10(arc.passengers / 1000 + 1) * 0.8)
}

// Props that get spread into Globe component
export function buildArcsProps(arcs: RouteArc[], colorMode: 'udan' | 'traffic') {
  return {
    arcsData: arcs,
    arcStartLat: (d: unknown) => (d as RouteArc).originLat,
    arcStartLng: (d: unknown) => (d as RouteArc).originLon,
    arcEndLat: (d: unknown) => (d as RouteArc).destLat,
    arcEndLng: (d: unknown) => (d as RouteArc).destLon,
    arcColor: (d: unknown) => {
      const arc = d as RouteArc
      return [arcColor(arc, 'start'), arcColor(arc, 'end')]
    },
    arcStroke: (d: unknown) => arcWidth(d as RouteArc),
    arcAltitude: 0.3,
    arcCurveResolution: 64,
    arcLabel: (d: unknown) => {
      const arc = d as RouteArc
      return `<div style="background:rgba(0,0,0,0.8);padding:4px 8px;border-radius:6px;font-size:11px;color:#fff">
        ${arc.originIata} → ${arc.destIata}<br/>
        ${arc.passengers.toLocaleString('en-IN')} pax/mo
      </div>`
    },
  }
}

// Hook-compatible data transformer
export const RouteArcs = memo(function RouteArcs() {
  // Actual rendering is done via IndiaGlobe arcsData props
  // This component is a utility export — the globe consumes buildArcsProps directly
  return null
})
