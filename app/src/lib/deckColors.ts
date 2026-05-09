import type { Airport } from '../../../shared/src/index'

type RGBA = [number, number, number, number]

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function equityColorRgb(airport: Airport): RGBA {
  const thirtyDaysAgo = Date.now() - THIRTY_DAYS_MS
  const isIdle =
    airport.udanServed &&
    (!airport.lastSeenFlight ||
      airport.lastSeenFlight.getTime() < thirtyDaysAgo)

  if (isIdle) return [239, 68, 68, 255]           // red — idle UDAN
  if (airport.udanServed) return [249, 115, 22, 255]  // orange — active UDAN
  if (airport.scheduledService) return [34, 197, 94, 255]  // green — scheduled
  return [100, 116, 139, 255]                          // gray — no service
}

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

export function arcStartRgb(arc: RouteArc): RGBA {
  return arc.isUdan ? [251, 146, 60, 230] : [96, 165, 250, 178]
}

export function arcEndRgb(arc: RouteArc): RGBA {
  return arc.isUdan ? [239, 68, 68, 230] : [139, 92, 246, 178]
}

export function arcWidthPx(arc: RouteArc): number {
  return Math.max(1, Math.min(4, Math.log10(arc.passengers / 1000 + 1) * 2))
}
