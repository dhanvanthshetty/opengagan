import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobeStore } from '../../store/globeStore'
import airlinesData from '../../../../shared/src/data/airlines.json'

// ICAO airline code → airline name (India-focused)
const ICAO_AIRLINES: Record<string, string> = airlinesData

function getAirlineName(callsign: string): string | null {
  if (!callsign || callsign.length < 3) return null
  return ICAO_AIRLINES[callsign.substring(0, 3).toUpperCase()] ?? null
}

function headingToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function formatEpochSeconds(sec?: number | null): string {
  if (!sec) return '—'
  const now = Date.now() / 1000
  const ageSec = Math.max(0, Math.round(now - sec))
  const age = ageSec < 60 ? `${ageSec}s ago` : `${Math.round(ageSec / 60)}m ago`
  const time = new Date(sec * 1000).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${time} (${age})`
}

function formatAltitude(meters?: number | null): string {
  if (meters == null) return '—'
  const ft = Math.round(meters * 3.281)
  return `${ft.toLocaleString()} ft / ${Math.round(meters).toLocaleString()} m`
}

function positionSourceLabel(source?: number | null): string {
  if (source == null) return '—'
  if (source === 0) return 'ADS-B'
  if (source === 1) return 'ASTERIX'
  if (source === 2) return 'MLAT'
  return `Source ${source}`
}

function flightStatus(onGround: boolean, verticalRate: number | null): { label: string; color: string } {
  if (onGround) return { label: 'On Ground', color: '#94a3b8' }
  if (verticalRate == null || Math.abs(verticalRate) < 1) return { label: 'Cruising', color: '#22c55e' }
  if (verticalRate > 1) return { label: `Climbing +${Math.round(verticalRate * 196.85)} fpm`, color: '#60a5fa' }
  return { label: `Descending ${Math.round(verticalRate * 196.85)} fpm`, color: '#f97316' }
}

export function AircraftPanel() {
  const { selectedAircraft, selectAircraft } = useGlobeStore()
  const navigate = useNavigate()

  if (!selectedAircraft) return null

  const a = selectedAircraft
  const callsign = a.callsign?.trim() || a.icao24
  const airline = getAirlineName(a.callsign ?? '')
  const altM = a.baroAltitude ? Math.round(a.baroAltitude) : null
  const altFt = a.baroAltitude ? Math.round(a.baroAltitude * 3.281) : null
  const speedKmh = a.velocity ? Math.round(a.velocity * 3.6) : null
  const speedKt = a.velocity ? Math.round(a.velocity * 1.944) : null
  const heading = a.trueTrack != null ? Math.round(a.trueTrack) : null
  const compass = heading != null ? headingToCompass(heading) : null
  const status = flightStatus(a.onGround, a.verticalRate)
  const geoAltLabel = formatAltitude(a.geoAltitude ?? null)
  const lastContactLabel = formatEpochSeconds(a.lastContact ?? null)
  const timePositionLabel = formatEpochSeconds(a.timePosition ?? null)
  const positionSource = positionSourceLabel(a.positionSource ?? null)
  const sensorsLabel = a.sensors?.length ? `${a.sensors.length} sensors` : '—'

  return (
    <div
      className="absolute top-16 right-4 z-20 w-80 rounded-2xl overflow-hidden text-sm shadow-2xl"
      style={{
        background: 'rgba(245,242,232,0.97)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(26,37,64,0.14)',
        boxShadow: '0 8px 32px rgba(26,37,64,0.18)',
        color: '#1a2540',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{
          background: 'rgba(26,37,64,0.06)',
          borderBottom: '1px solid rgba(26,37,64,0.10)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✈</span>
              <div>
                <div className="font-bold text-xl font-mono leading-tight" style={{ color: '#1a2540' }}>{callsign}</div>
                {airline && <div className="text-xs mt-0.5" style={{ color: '#6b7838' }}>{airline}</div>}
              </div>
            </div>
            <div className="text-xs mt-1 font-mono" style={{ color: 'rgba(26,37,64,0.45)' }}>{a.icao24.toUpperCase()}</div>
          </div>
          <button
            onClick={() => selectAircraft(null)}
            className="text-xl leading-none mt-1 transition-colors"
            style={{ color: 'rgba(26,37,64,0.45)' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Flight status badge */}
        <div className="mt-3">
          <span
            className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: status.color + '22', color: status.color, border: `1px solid ${status.color}44` }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-2.5">
        {/* Altitude */}
        <Row label="Altitude">
          {altFt
            ? <span>{altFt.toLocaleString()} <span style={{ color: 'rgba(26,37,64,0.45)' }}>ft</span> <span style={{ color: 'rgba(26,37,64,0.45)' }}>/ {altM?.toLocaleString()} m</span></span>
            : <span style={{ color: 'rgba(26,37,64,0.45)' }}>On Ground</span>
          }
        </Row>

        {/* Geo altitude */}
        <Row label="Geo Altitude">
          <span>{geoAltLabel}</span>
        </Row>

        {/* Speed */}
        <Row label="Speed">
          {speedKt
            ? <span>{speedKt} <span style={{ color: 'rgba(26,37,64,0.45)' }}>kt</span> <span style={{ color: 'rgba(26,37,64,0.45)' }}>/ {speedKmh} km/h</span></span>
            : <span style={{ color: 'rgba(26,37,64,0.45)' }}>—</span>
          }
        </Row>

        {/* Heading */}
        <Row label="Heading">
          {heading != null
            ? <span>{heading}° <span style={{ color: 'rgba(26,37,64,0.55)' }}>({compass})</span></span>
            : <span style={{ color: 'rgba(26,37,64,0.45)' }}>—</span>
          }
        </Row>

        {/* Squawk */}
        <Row label="Squawk">
          <span>{a.squawk ?? '—'}</span>
        </Row>

        {/* Last contact */}
        <Row label="Last Contact">
          <span className="text-xs" style={{ color: '#2d3d5c' }}>{lastContactLabel}</span>
        </Row>

        {/* Time position */}
        <Row label="Time Position">
          <span className="text-xs" style={{ color: '#2d3d5c' }}>{timePositionLabel}</span>
        </Row>

        {/* Origin country */}
        <Row label="Registered">
          <span>{a.originCountry || '—'}</span>
        </Row>

        {/* Position source */}
        <Row label="Position Source">
          <span>{positionSource}</span>
        </Row>

        {/* SPI */}
        <Row label="SPI">
          <span>{a.spi ? 'Yes' : 'No'}</span>
        </Row>

        {/* Sensors */}
        <Row label="Sensors">
          <span>{sensorsLabel}</span>
        </Row>

        {/* Position */}
        <Row label="Position">
          <span className="font-mono text-xs">
            {a.latitude.toFixed(3)}°N, {a.longitude.toFixed(3)}°E
          </span>
        </Row>
      </div>

      {/* Tip */}
      <div className="px-5 pb-2">
        <p className="text-xs italic" style={{ color: 'rgba(26,37,64,0.45)' }}>
          Click "Calculate CO₂" to estimate this flight's carbon footprint.
        </p>
      </div>

      <div className="px-5 pb-4">
        <button
          onClick={() => navigate('/carbon')}
          className="w-full rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
          style={{ background: '#6b7838', color: '#ECE8D4' }}
        >
          Calculate CO₂ →
        </button>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex justify-between items-center py-1"
      style={{ borderBottom: '1px solid rgba(26,37,64,0.08)' }}
    >
      <span className="shrink-0 mr-3" style={{ color: 'rgba(26,37,64,0.55)' }}>{label}</span>
      <span className="font-medium text-right" style={{ color: '#1a2540' }}>{children}</span>
    </div>
  )
}
