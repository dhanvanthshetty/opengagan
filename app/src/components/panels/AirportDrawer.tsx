import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGlobeStore } from '../../store/globeStore'
import { useAirportImage } from '../../hooks/useAirportImage'
import type { AircraftState } from '../../types'

const LOGO = '/assets/logo-icon.png'

function distKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dlat = (lat1 - lat2) * 111
  const dlon = (lon1 - lon2) * 111 * Math.cos((lat2 * Math.PI) / 180)
  return Math.sqrt(dlat * dlat + dlon * dlon)
}

function categorise(s: AircraftState, lat: number, lon: number) {
  const d = distKm(s.latitude, s.longitude, lat, lon)
  if (d > 80) return null
  if (s.onGround && d < 5) return 'parked'
  if (!s.onGround && (s.verticalRate ?? 0) < -1) return 'arriving'
  if (!s.onGround && (s.verticalRate ?? 0) > 1) return 'departing'
  return 'nearby'
}

export function AirportDrawer() {
  const { selectedAirport, selectAirport, liveStates } = useGlobeStore()
  const {
    data: imageData,
    isLoading: imageLoading,
    isFetching: imageFetching,
    isFetched: imageFetched,
    refresh: refreshPhoto,
  } = useAirportImage(selectedAirport)
  const [refreshing, setRefreshing] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const [imageError, setImageError] = useState(false)

  const a = selectedAirport
  const isOpen = Boolean(a)
  const imageForAirport = a && imageData?.icao === a.icao ? imageData : null
  const imageUrl = imageForAirport?.url ?? null
  const imageStatus = imageForAirport?.status ?? null
  const [lon, lat] = a ? a.location.coordinates : [0, 0]

  useEffect(() => {
    setImageReady(false)
    setImageError(false)
    setRefreshing(false)
  }, [a?.icao, imageUrl])

  const traffic = useMemo(() => {
    if (!a) return { arriving: 0, departing: 0, parked: 0, nearby: 0 }
    const result = { arriving: 0, departing: 0, parked: 0, nearby: 0 }
    for (const s of liveStates) {
      const cat = categorise(s, lat, lon)
      if (cat) result[cat]++
    }
    return result
  }, [liveStates, a, lat, lon])

  const totalNear = traffic.arriving + traffic.departing + traffic.parked + traffic.nearby

  const delta = 0.06
  const osmUrl = a
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik&marker=${lat},${lon}`
    : ''

  return (
    // Right side panel — slides in from the right, globe fully visible on left
    <div
      className="absolute top-0 right-0 bottom-0 z-30 flex flex-col shadow-2xl"
      style={{
        width: 380,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.36s cubic-bezier(0.32, 0.72, 0, 1)',
        willChange: 'transform',
        background: 'rgba(245,242,232,0.97)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(26,37,64,0.14)',
        color: '#1a2540',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 pt-14 pb-4"
        style={{
          borderBottom: '1px solid rgba(26,37,64,0.10)',
          background: 'rgba(236,232,212,0.93)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Codes row */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {a?.iata && (
                <span
                  className="rounded px-2.5 py-0.5 font-mono text-sm font-bold tracking-widest"
                  style={{
                    background: 'rgba(107,120,56,0.15)',
                    color: '#6b7838',
                    border: '1px solid rgba(107,120,56,0.3)',
                  }}
                >
                  {a.iata}
                </span>
              )}
              {a && (
                <span
                  className="rounded px-2 py-0.5 font-mono text-xs"
                  style={{
                    background: 'rgba(26,37,64,0.07)',
                    color: '#2d3d5c',
                    border: '1px solid rgba(26,37,64,0.12)',
                  }}
                >
                  {a.icao}
                </span>
              )}
              {a?.udanServed && (
                <span
                  className="rounded px-2 py-0.5 text-xs"
                  style={{
                    background: 'rgba(249,115,22,0.10)',
                    color: '#c2410c',
                    border: '1px solid rgba(249,115,22,0.20)',
                  }}
                >
                  UDAN
                </span>
              )}
              {a?.scheduledService && (
                <span
                  className="rounded px-2 py-0.5 text-xs"
                  style={{
                    background: 'rgba(34,197,94,0.10)',
                    color: '#15803d',
                    border: '1px solid rgba(34,197,94,0.20)',
                  }}
                >
                  Scheduled
                </span>
              )}
            </div>
            <h2 className="font-bold text-base leading-snug" style={{ color: '#1a2540' }}>{a?.name}</h2>
            {a?.municipality && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(26,37,64,0.55)' }}>
                {a.municipality}{a.country ? `, ${a.country}` : ''}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => selectAirport(null)}
            aria-label="Close"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-xl leading-none transition-colors"
            style={{ color: 'rgba(26,37,64,0.45)' }}
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(26,37,64,0.2) transparent' }}
      >
        {a && (
          <div className="flex flex-col gap-0">

            {/* ── Hero photo ── */}
            <div
              className="relative w-full overflow-hidden"
              style={{ height: 200, background: 'rgba(26,37,64,0.06)' }}
            >
              {/* Loading — logo pulse animation */}
              {(!imageFetched || imageLoading || imageFetching || refreshing) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <img
                    src={LOGO}
                    alt="Searching…"
                    className="w-12 h-12 animate-pulse"
                    style={{ borderRadius: '50%', opacity: 0.6 }}
                  />
                  <span className="text-xs" style={{ color: 'rgba(26,37,64,0.4)' }}>
                    Searching for photo…
                  </span>
                </div>
              )}

              {/* Photo loaded */}
              {imageUrl && imageStatus === 'ok' && !imageError && (
                <img
                  src={imageUrl}
                  alt={a.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onLoad={() => setImageReady(true)}
                  onError={() => setImageError(true)}
                  style={{ opacity: imageReady ? 1 : 0, transition: 'opacity 0.4s ease' }}
                />
              )}

              {/* While photo URL exists but hasn't loaded yet — keep logo visible */}
              {imageUrl && imageStatus === 'ok' && !imageReady && !imageError && imageFetched && !imageFetching && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <img
                    src={LOGO}
                    alt=""
                    className="w-12 h-12 animate-pulse"
                    style={{ borderRadius: '50%', opacity: 0.5 }}
                  />
                </div>
              )}

              {/* No photo found */}
              {imageFetched && !imageFetching && !imageLoading && !refreshing &&
                (!imageUrl || imageStatus !== 'ok' || imageError) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <img
                    src={LOGO}
                    alt=""
                    className="w-10 h-10"
                    style={{ borderRadius: '50%', opacity: 0.25 }}
                  />
                  <span className="text-xs" style={{ color: 'rgba(26,37,64,0.35)' }}>
                    No photo found
                  </span>
                  <button
                    onClick={async () => {
                      setRefreshing(true)
                      await refreshPhoto()
                      setRefreshing(false)
                    }}
                    className="text-[11px] px-3 py-1 rounded-full transition-colors"
                    style={{
                      background: 'rgba(26,37,64,0.07)',
                      border: '1px solid rgba(26,37,64,0.15)',
                      color: 'rgba(26,37,64,0.55)',
                    }}
                  >
                    Search again
                  </button>
                </div>
              )}

              {/* Gradient scrim + chips — only when photo is visible */}
              {imageUrl && imageStatus === 'ok' && !imageError && imageReady && (
                <div className="absolute inset-0 bg-gradient-to-t from-[#ECE8D4] via-transparent to-transparent" style={{ opacity: 0.7 }} />
              )}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <span
                  className="backdrop-blur-sm text-[11px] px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(236,232,212,0.85)',
                    border: '1px solid rgba(26,37,64,0.14)',
                    color: '#2d3d5c',
                  }}
                >
                  {a.type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                {a.elevationFt && (
                  <span
                    className="backdrop-blur-sm text-[11px] px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(236,232,212,0.85)',
                      border: '1px solid rgba(26,37,64,0.14)',
                      color: '#2d3d5c',
                    }}
                  >
                    {a.elevationFt.toLocaleString()} ft MSL
                  </span>
                )}
              </div>
            </div>

            {/* ── OSM mini-map ── */}
            <div
              className="relative mx-4 mt-4 rounded-xl overflow-hidden"
              style={{ height: 200, border: '1px solid rgba(26,37,64,0.12)' }}
            >
              <iframe
                src={osmUrl}
                title={`Map of ${a.name}`}
                width="100%"
                height="100%"
                style={{
                  border: 'none',
                  display: 'block',
                }}
                loading="lazy"
              />
              <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 backdrop-blur-sm text-[10px] px-2 py-0.5 rounded-md transition-colors"
                style={{
                  background: 'rgba(236,232,212,0.9)',
                  border: '1px solid rgba(26,37,64,0.14)',
                  color: '#2d3d5c',
                }}
              >
                Open map ↗
              </a>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 gap-2 px-4 mt-4">
              <StatTile label="Latitude" value={`${lat.toFixed(5)}° N`} />
              <StatTile label="Longitude" value={`${lon.toFixed(5)}° E`} />
              <StatTile label="Elevation" value={a.elevationFt ? `${a.elevationFt.toLocaleString()} ft` : '—'} />
              <StatTile label="Service" value={a.scheduledService ? 'Scheduled' : 'Unscheduled'} />
              {a.lastSeenFlight && (
                <StatTile
                  label="Last Flight"
                  value={new Date(a.lastSeenFlight).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                />
              )}
              {a.udanServed && (
                <StatTile label="UDAN" value="Served under scheme" accent />
              )}
            </div>

            {/* ── Live traffic ── */}
            <div
              className="mx-4 mt-4 rounded-xl p-4"
              style={{
                background: 'rgba(26,37,64,0.05)',
                border: '1px solid rgba(26,37,64,0.10)',
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'rgba(26,37,64,0.45)' }}
              >
                Live Traffic · within 80 km
              </div>
              {totalNear === 0 ? (
                <div className="text-xs text-center py-1" style={{ color: 'rgba(26,37,64,0.45)' }}>
                  No aircraft detected nearby
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  <TrafficChip icon="↓" label="Arriving" count={traffic.arriving} color="#60a5fa" />
                  <TrafficChip icon="↑" label="Departing" count={traffic.departing} color="#34d399" />
                  <TrafficChip icon="■" label="Parked" count={traffic.parked} color="#94a3b8" />
                  <TrafficChip icon="~" label="Nearby" count={traffic.nearby} color="#a78bfa" />
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="flex flex-col gap-2 px-4 mt-4 mb-6">
              <Link
                to={`/carbon?origin=${a.iata ?? a.icao}`}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors text-center"
                style={{ background: '#1a2540', color: '#ECE8D4' }}
              >
                Calculate CO₂ for this route →
              </Link>
              <div className="flex gap-2">
                <a
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(a.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors text-center"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(26,37,64,0.18)',
                    color: '#2d3d5c',
                  }}
                >
                  Wikipedia ↗
                </a>
                <a
                  href={`https://www.airnav.com/airport/${a.icao}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors text-center"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(26,37,64,0.18)',
                    color: '#2d3d5c',
                  }}
                >
                  AirNav ↗
                </a>
                <a
                  href="https://airsewa.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors text-center"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(26,37,64,0.18)',
                    color: '#2d3d5c',
                  }}
                >
                  AirSewa ↗
                </a>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={
        accent
          ? {
              background: 'rgba(249,115,22,0.08)',
              border: '1px solid rgba(249,115,22,0.18)',
            }
          : {
              background: 'rgba(26,37,64,0.05)',
              border: '1px solid rgba(26,37,64,0.10)',
            }
      }
    >
      <div
        className="text-[10px] uppercase tracking-wide leading-none mb-1.5"
        style={{ color: 'rgba(26,37,64,0.45)' }}
      >
        {label}
      </div>
      <div
        className="text-sm font-medium leading-tight"
        style={{ color: accent ? '#c2410c' : '#1a2540' }}
      >
        {value}
      </div>
    </div>
  )
}

function TrafficChip({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <div
      className="flex flex-col items-center rounded-xl px-2 py-2.5"
      style={{ background: color + '15', border: `1px solid ${color}30` }}
    >
      <span style={{ color, fontSize: 14 }}>{icon}</span>
      <div className="font-bold text-base leading-none mt-1" style={{ color: '#1a2540' }}>{count}</div>
      <div className="text-[10px] mt-0.5 text-center" style={{ color: 'rgba(26,37,64,0.55)' }}>{label}</div>
    </div>
  )
}
