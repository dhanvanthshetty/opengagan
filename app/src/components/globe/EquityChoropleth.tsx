// EquityChoropleth.tsx
// Utility to build the equity ring data for idle UDAN airports
// Returns ringsData and hexBinData for use in IndiaGlobe

export interface IdleAirport {
  icao: string
  iata?: string
  name: string
  lat: number
  lon: number
  udanServed: boolean
  lastSeenFlight?: Date | null
}

// Converts an idle airport to a pulsing ring descriptor for react-globe.gl
export function buildEquityRings(airports: IdleAirport[]) {
  const now = Date.now()
  return airports
    .filter((a) => {
      // Idle = UDAN served but no flight for 30+ days
      if (!a.udanServed) return false
      if (!a.lastSeenFlight) return true
      return now - new Date(a.lastSeenFlight).getTime() > 30 * 24 * 60 * 60 * 1000
    })
    .map((a) => ({
      lat: a.lat,
      lng: a.lon,
      maxR: 1.5,
      propagationSpeed: 1.2,
      repeatPeriod: 2000,
      color: () => `rgba(239, 68, 68, ${Math.random() * 0.4 + 0.4})`,
      label: `${a.iata ?? a.icao}: ${a.name} — idle UDAN airport`,
    }))
}

// Color scale for airport points: green=served+active, orange=UDAN, red=idle/unserved
export function equityColor(airport: { scheduledService: boolean; udanServed?: boolean; lastSeenFlight?: Date | null }): string {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const isIdle = airport.udanServed && (!airport.lastSeenFlight || new Date(airport.lastSeenFlight).getTime() < thirtyDaysAgo)
  if (isIdle) return '#EF4444'          // red — idle UDAN
  if (airport.udanServed) return '#F97316'  // orange — active UDAN
  if (airport.scheduledService) return '#22C55E'  // green — regular service
  return '#64748B'                           // gray — no service
}
