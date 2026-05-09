import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobeStore } from '../../store/globeStore'
import type { AircraftState } from '../../types'

// Simple bounding-circle proximity check (≈ radius km)
function nearbyRadius(aircraftLat: number, aircraftLon: number, airportLat: number, airportLon: number): number {
  const dlat = (aircraftLat - airportLat) * 111
  const dlon = (aircraftLon - airportLon) * 111 * Math.cos((airportLat * Math.PI) / 180)
  return Math.sqrt(dlat * dlat + dlon * dlon)
}

function categorise(state: AircraftState, airportLat: number, airportLon: number) {
  const dist = nearbyRadius(state.latitude, state.longitude, airportLat, airportLon)
  if (dist > 80) return null
  if (state.onGround && dist < 5) return 'parked'
  if (!state.onGround && (state.verticalRate ?? 0) < -1) return 'arriving'
  if (!state.onGround && (state.verticalRate ?? 0) > 1) return 'departing'
  return 'nearby'
}

function airportTypeLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function AirportMiniMap({ lat, lon, type }: { lat: number; lon: number; type?: string }) {
  // Tighter bbox for large airports (more runways visible), wider for small
  const delta = type === 'large_airport' ? 0.05 : type === 'medium_airport' ? 0.035 : 0.02
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`

  return (
    <div className="relative border-b border-white/10">
      <iframe
        src={src}
        className="w-full border-0"
        style={{ height: 160 }}
        title="Airport map"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="absolute bottom-1 right-1 bg-black/60 text-slate-400 text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
        © OpenStreetMap
      </div>
    </div>
  )
}

export function AirportPanel() {
  const { selectedAirport, selectAirport, liveStates } = useGlobeStore()
  const navigate = useNavigate()

  const a = selectedAirport
  if (!a) return null

  const [lon, lat] = a.location.coordinates

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const traffic = useMemo(() => {
    const result = { arriving: 0, departing: 0, parked: 0, nearby: 0 }
    for (const s of liveStates) {
      const cat = categorise(s, lat, lon)
      if (cat) result[cat]++
    }
    return result
  }, [liveStates, lat, lon])

  const totalNear = traffic.arriving + traffic.departing + traffic.parked + traffic.nearby

  return (
    <div className="absolute top-16 right-4 z-20 w-80 bg-black/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden text-sm shadow-2xl">
      {/* Header */}
      <div className="bg-slate-800/60 border-b border-white/10 px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="mr-3">
            <div className="text-white font-bold text-base leading-snug">{a.name}</div>
            <div className="text-slate-400 text-xs mt-0.5">{a.municipality}</div>
          </div>
          <button
            onClick={() => selectAirport(null)}
            className="text-slate-500 hover:text-white text-xl leading-none shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {a.iata && (
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded px-2 py-0.5 font-mono text-xs">
              {a.iata}
            </span>
          )}
          <span className="bg-white/10 text-slate-300 border border-white/10 rounded px-2 py-0.5 font-mono text-xs">
            {a.icao}
          </span>
          {a.udanServed && (
            <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded px-2 py-0.5 text-xs">
              UDAN
            </span>
          )}
          {a.scheduledService && (
            <span className="bg-green-500/20 text-green-300 border border-green-500/30 rounded px-2 py-0.5 text-xs">
              Scheduled
            </span>
          )}
        </div>
      </div>

      {/* OSM map — shows actual airport runway/boundary layout */}
      <AirportMiniMap lat={lat} lon={lon} type={a.type} />

      {/* Airport details */}
      <div className="px-5 py-4 space-y-2">
        <Row label="Type" value={airportTypeLabel(a.type ?? '')} />
        <Row label="Elevation" value={a.elevationFt ? `${a.elevationFt.toLocaleString()} ft` : '—'} />
        <Row label="Coordinates" value={`${lat.toFixed(3)}°N  ${lon.toFixed(3)}°E`} />
      </div>

      {/* Live traffic */}
      <div className="px-5 pb-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">
            Live Traffic <span className="text-slate-600 font-normal normal-case">(within 80 km)</span>
          </div>

          {totalNear === 0 ? (
            <div className="text-slate-600 text-xs text-center py-2">No aircraft detected nearby</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <TrafficBadge icon="↓" label="Arriving" count={traffic.arriving} color="#60a5fa" />
              <TrafficBadge icon="↑" label="Departing" count={traffic.departing} color="#34d399" />
              <TrafficBadge icon="■" label="Parked" count={traffic.parked} color="#94a3b8" />
              <TrafficBadge icon="~" label="Nearby" count={traffic.nearby} color="#a78bfa" />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-4">
        <button
          onClick={() => navigate(`/airport/${a.icao}`)}
          className="w-full bg-blue-700 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
        >
          View full details →
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-white/5">
      <span className="text-slate-500 shrink-0 mr-3">{label}</span>
      <span className="text-slate-200 font-medium capitalize text-right">{value ?? '—'}</span>
    </div>
  )
}

function TrafficBadge({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{ background: color + '15', border: `1px solid ${color}30` }}
    >
      <span style={{ color, fontSize: 14 }}>{icon}</span>
      <div>
        <div className="text-white font-bold text-base leading-none">{count}</div>
        <div className="text-slate-500 text-xs mt-0.5">{label}</div>
      </div>
    </div>
  )
}
