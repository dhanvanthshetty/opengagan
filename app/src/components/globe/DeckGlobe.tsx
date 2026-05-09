// DeckGlobe.tsx — replaces IndiaGlobe.tsx
// Uses deck.gl GlobeView + OSM TileLayer for sharp tile rendering at every zoom level.
// Same props interface as IndiaGlobe: { airports, states }
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DeckGL from '@deck.gl/react'
import { _GlobeView as GlobeView, FlyToInterpolator } from '@deck.gl/core'
import type { PickingInfo } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
import {
  BitmapLayer,
  ScatterplotLayer,
  ArcLayer,
  TextLayer,
  GeoJsonLayer,
} from '@deck.gl/layers'
import { SimpleMeshLayer } from '@deck.gl/mesh-layers'
import { AIRCRAFT_MESH } from '../../lib/aircraftMesh'
import { useGlobeStore } from '../../store/globeStore'
import { useAlerts } from '../../hooks/useAlerts'
import { useRoutes } from '../../hooks/useRoutes'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { useFogData } from '../../hooks/useFog'
import type { FIRMSPoint } from './FIRMSHotspots'
import type { Airport, AircraftState } from '../../types'
import {
  equityColorRgb,
  arcStartRgb,
  arcEndRgb,
  arcWidthPx,
} from '../../lib/deckColors'
import type { RouteArc } from '../../lib/deckColors'

// ── Constants ────────────────────────────────────────────────────────────────

const GLOBE_VIEW = new GlobeView({ id: 'globe' })

const INITIAL_VIEW = {
  longitude: 78.9,
  latitude: 20.5,
  zoom: 4,
  minZoom: 1,
  maxZoom: 18,
}

// Tooltip style — must be Partial<CSSStyleDeclaration> (all strings) for deck.gl
const TOOLTIP_STYLE: Partial<CSSStyleDeclaration> = {
  background: 'rgba(0,0,0,0.88)',
  color: '#fff',
  padding: '6px 10px',
  borderRadius: '8px',
  fontSize: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  lineHeight: '1.5',
  pointerEvents: 'none',
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAltitudeMeters(d: AircraftState): number {
  const rawAlt = d.baroAltitude ?? 0
  const finiteAlt = Number.isFinite(rawAlt) ? rawAlt : 0
  const meters = finiteAlt > 16_000 ? finiteAlt * 0.3048 : finiteAlt
  const clamped = Math.min(Math.max(meters, 0), 12_000)
  const minSky = d.onGround ? 800 : 15_000
  return Math.max(minSky, clamped * 8)
}

/** Dead-reckoning: move aircraft forward using velocity + heading since `fetchedAt` */
function interpolatePosition(
  d: AircraftState,
  fetchedAt: number
): [number, number, number] {
  const elapsed = Math.min((Date.now() - fetchedAt) / 1000, 90) // cap at 90 s
  const distM = (d.velocity ?? 0) * elapsed
  const headingRad = ((d.trueTrack ?? 0) * Math.PI) / 180
  const cosLat = Math.cos((d.latitude * Math.PI) / 180) || 0.001
  const dLat = (distM * Math.cos(headingRad)) / 111_320
  const dLon = (distM * Math.sin(headingRad)) / (111_320 * cosLat)
  return [d.longitude + dLon, d.latitude + dLat, getAltitudeMeters(d)]
}


// ── Types ─────────────────────────────────────────────────────────────────────

interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  minZoom: number
  maxZoom: number
  transitionDuration?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transitionInterpolator?: any
}

interface RingPoint {
  lon: number
  lat: number
  rgb: [number, number, number]
}

interface Props {
  airports: Airport[]
  states: AircraftState[]
  firmsData?: FIRMSPoint[]
}

// ── Component ────────────────────────────────────────────────────────────────

export function DeckGlobe({ airports, states, firmsData }: Props) {
  const {
    activeLayers,
    selectAircraft,
    selectAirport,
    carbonRoute,
    selectedAirport,
  } = useGlobeStore()
  const { fogAlerts, firmsAlerts } = useAlerts()
  const { data: routes, refetch: refetchRoutes } = useRoutes()
  const { data: fogData } = useFogData(activeLayers.has('fog'))

  // Refetch routes whenever UDAN layer is turned on (handles first-toggle case)
  const udanActive = activeLayers.has('udan')
  useEffect(() => {
    if (udanActive) refetchRoutes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [udanActive])

  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW)
  const [indiaGeo, setIndiaGeo] = useState<object | null>(null)
  const [pulse, setPulse] = useState(0)

  // Track when `states` was last updated so aircraft can interpolate forward
  const statesFetchedAtRef = useRef<number>(Date.now())
  useEffect(() => {
    statesFetchedAtRef.current = Date.now()
  }, [states])

  // Stable string key from the Set so useMemo always detects layer toggles
  const activeLayersKey = [...activeLayers].sort().join(',')

  // Load India state borders GeoJSON
  useEffect(() => {
    fetch('/india-states.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setIndiaGeo(d) })
      .catch(() => {})
  }, [])

  // Drive ring pulse: 0 → 1 → 0 every ~5 s
  useAnimationFrame((t) => {
    setPulse((Math.sin(t / 800) + 1) / 2)
  })

  // Fly camera to selected airport
  useEffect(() => {
    if (!selectedAirport) return
    const [lng, lat] = selectedAirport.location.coordinates
    setViewState((prev) => ({
      ...prev,
      longitude: lng,
      latitude: lat,
      zoom: Math.max(prev.zoom, 10),
      transitionDuration: 1200,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
    }))
  }, [selectedAirport])

  // ── Ring data (fog + FIRMS socket alerts + idle UDAN equity) ────────────

  const ringData = useMemo((): RingPoint[] => {
    const items: RingPoint[] = []
    const airportByIcao = new Map(airports.map((a) => [a.icao, a]))
    const addedIcaos = new Set<string>()

    if (activeLayers.has('fog')) {
      // Real-time socket alerts (emitted when RVR < 550 m at VIDP)
      for (const alert of fogAlerts) {
        const ap = airportByIcao.get(alert.icao)
        if (!ap) continue
        addedIcaos.add(alert.icao)
        items.push({
          lon: ap.location.coordinates[0],
          lat: ap.location.coordinates[1],
          rgb: alert.rvr < 200 ? [239, 68, 68] : [251, 191, 36],
        })
      }
      // REST-polled fog data (any airport with low visibility in WeatherCache)
      for (const point of fogData ?? []) {
        if (addedIcaos.has(point.icao)) continue  // don't duplicate socket alert
        const isSevere = (point.rvrMin ?? 9999) < 200 || (point.visibility ?? 9999) < 200
        items.push({
          lon: point.longitude,
          lat: point.latitude,
          rgb: isSevere ? [239, 68, 68] : [251, 191, 36],
        })
      }
    }

    if (activeLayers.has('firms')) {
      // Socket-based near-airport fire alerts
      for (const alert of firmsAlerts) {
        const ap = airportByIcao.get(alert.icao)
        if (!ap) continue
        items.push({
          lon: ap.location.coordinates[0],
          lat: ap.location.coordinates[1],
          rgb: [239, 68, 68],
        })
      }
      // REST-polled FIRMS hotspots — all of them get animated rings
      for (const point of firmsData ?? []) {
        const isHigh = point.confidence?.toLowerCase() === 'high'
        items.push({
          lon: point.longitude,
          lat: point.latitude,
          rgb: isHigh ? [239, 68, 68] : [251, 191, 36],
        })
      }
    }

    if (activeLayers.has('udan')) {
      const thirtyDaysAgo = Date.now() - THIRTY_DAYS_MS
      for (const ap of airports) {
        if (!ap.udanServed) continue
        const isIdle = !ap.lastSeenFlight || ap.lastSeenFlight.getTime() < thirtyDaysAgo
        if (!isIdle) continue
        items.push({
          lon: ap.location.coordinates[0],
          lat: ap.location.coordinates[1],
          rgb: [239, 68, 68],
        })
      }
    }

    return items
  }, [fogAlerts, fogData, firmsAlerts, firmsData, airports, activeLayersKey])

  // Zoom-adaptive aircraft size (meters): large on globe overview, small at street zoom
  const aircraftScale = useMemo(() => {
    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
    const zoomDrop = Math.pow(0.5, Math.max(0, viewState.zoom - 4))
    return Math.round(clamp(38_000 * zoomDrop, 1_200, 38_000))
  }, [viewState.zoom])

  // ── Static layers (recompute only when source data changes) ─────────────

  const staticLayers = useMemo(() => {
    const zoom = viewState.zoom
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers: any[] = []

    // 1. OSM base tiles — sharp at every zoom level
    layers.push(
      new TileLayer({
        id: 'osm-tiles',
        data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderSubLayers: (props: any) => {
          const { west, south, east, north } = props.tile.bbox
          return new BitmapLayer(props, {
            data: undefined,
            image: props.data,
            bounds: [west, south, east, north] as [number, number, number, number],
          })
        },
      })
    )

    // 2. India state borders
    if (indiaGeo) {
      layers.push(
        new GeoJsonLayer({
          id: 'india-borders',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: indiaGeo as any,
          stroked: true,
          filled: false,
          lineWidthMinPixels: 1,
          getLineColor: [255, 255, 255, 40],
        })
      )
    }

    // 3. Airport dots — radiusMinPixels/Max so they never become huge circles
    layers.push(
      new ScatterplotLayer<Airport>({
        id: 'airports',
        data: airports,
        getPosition: (d) => d.location.coordinates as [number, number],
        getFillColor: (d) => equityColorRgb(d),
        getRadius: (d) =>
          d.type === 'large_airport' ? 800 : d.type === 'medium_airport' ? 500 : 300,
        radiusMinPixels: 4,
        radiusMaxPixels: 14,
        pickable: true,
      })
    )

    // 4. FIRMS fire hotspots — soft glow disc (animated rings are in ringLayers)
    if (activeLayers.has('firms') && firmsData && firmsData.length > 0) {
      layers.push(
        new ScatterplotLayer<FIRMSPoint>({
          id: 'firms-glow',
          data: firmsData,
          getPosition: (d) => [d.longitude, d.latitude] as [number, number],
          getFillColor: (d) =>
            d.confidence?.toLowerCase() === 'high'
              ? [239, 68, 68, 55] as [number, number, number, number]
              : [251, 191, 36, 45] as [number, number, number, number],
          getRadius: (d) =>
            d.confidence?.toLowerCase() === 'high' ? 50_000 : 35_000,
          radiusMinPixels: 12,
          radiusMaxPixels: 32,
          pickable: false,
        })
      )
    }

    // 5. UDAN route arcs (only when carbon is not active)
    if (activeLayers.has('udan') && routes?.length && !carbonRoute) {
      layers.push(
        new ArcLayer<RouteArc>({
          id: 'udan-routes',
          data: routes as RouteArc[],
          getSourcePosition: (d) => [d.originLon, d.originLat],
          getTargetPosition: (d) => [d.destLon, d.destLat],
          getSourceColor: (d) => arcStartRgb(d),
          getTargetColor: (d) => arcEndRgb(d),
          getWidth: (d) => arcWidthPx(d),
          widthMinPixels: 1,
          widthMaxPixels: 4,
          greatCircle: true,
          getHeight: 0.5,
          pickable: true,
        })
      )
    }

    // 6. Carbon arc (replaces UDAN arcs when carbon layer active)
    if (activeLayers.has('carbon') && carbonRoute) {
      layers.push(
        new ArcLayer({
          id: 'carbon-arc',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: [carbonRoute] as any[],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getSourcePosition: (d: any) => [d.originLon, d.originLat],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getTargetPosition: (d: any) => [d.destLon, d.destLat],
          getSourceColor: [251, 191, 36, 230] as [number, number, number, number],
          getTargetColor: [239, 68, 68, 230] as [number, number, number, number],
          getWidth: 3,
          greatCircle: true,
          getHeight: 0.5,
        })
      )
    }

    // 7. Airport labels — only at zoom ≥ 7 to avoid clutter on the globe overview
    if (zoom >= 7) {
      layers.push(
        new TextLayer<Airport>({
          id: 'airport-labels',
          data: airports,
          getPosition: (d) => d.location.coordinates as [number, number],
          getText: (d) => d.iata ?? d.icao,
          getSize: 12,
          getColor: [255, 255, 255, 200] as [number, number, number, number],
          getPixelOffset: [0, -18] as [number, number],
          background: true,
          getBackgroundColor: [0, 0, 0, 140] as [number, number, number, number],
          backgroundPadding: [3, 1, 3, 1] as [number, number, number, number],
        })
      )
    }

    return layers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airports, firmsData, routes, activeLayersKey, carbonRoute, indiaGeo, viewState.zoom])

  // ── Animated alert rings — 3 expanding rings + solid center dot ──────────
  // Three rings spaced 120° apart in phase create a continuous outward ripple.

  const ringLayers = useMemo(() => {
    if (ringData.length === 0) return []

    const BASE_R = 90_000       // max radius in meters
    const MIN_R  = 0.05         // ring starts near center (fraction of BASE_R)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: any[] = []

    // 3 concentric rings, each offset by 1/3 of the cycle
    ;[0, 1 / 3, 2 / 3].forEach((phaseOffset, i) => {
      const p = (pulse + phaseOffset) % 1          // each ring at a different stage
      const radius = BASE_R * (MIN_R + p * (1 - MIN_R))
      const alpha  = Math.round(220 * (1 - p))     // fades as it expands

      out.push(
        new ScatterplotLayer<RingPoint>({
          id: `alert-ring-${i}`,
          data: ringData,
          getPosition: (d) => [d.lon, d.lat] as [number, number],
          getRadius: radius,
          getFillColor: [0, 0, 0, 0] as [number, number, number, number],
          getLineColor: (d) =>
            [...d.rgb, alpha] as [number, number, number, number],
          stroked: true,
          filled: false,
          getLineWidth: 2_500,
          lineWidthMinPixels: 1.5,
          lineWidthMaxPixels: 3.5,
          updateTriggers: { getRadius: pulse, getLineColor: pulse },
        })
      )
    })

    // Solid bright center dot — always visible, never animated away
    out.push(
      new ScatterplotLayer<RingPoint>({
        id: 'alert-center',
        data: ringData,
        getPosition: (d) => [d.lon, d.lat] as [number, number],
        getFillColor: (d) =>
          [...d.rgb, 255] as [number, number, number, number],
        getRadius: 9_000,
        radiusMinPixels: 5,
        radiusMaxPixels: 11,
        stroked: true,
        getLineColor: [255, 255, 255, 200] as [number, number, number, number],
        getLineWidth: 1_000,
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 2,
        pickable: false,
      })
    )

    return out
  }, [ringData, pulse])

  // ── Per-frame aircraft layer (position interpolated via dead-reckoning) ──

  const aircraftLayer = useMemo(() => {
    if (!activeLayers.has('aircraft') || states.length === 0) return null
    const fetchedAt = statesFetchedAtRef.current
    return new SimpleMeshLayer<AircraftState>({
      id: 'aircraft',
      data: states,
      mesh: AIRCRAFT_MESH,
      // Dead-reckoning: advance position by velocity × elapsed time
      getPosition: (d) => interpolatePosition(d, fetchedAt),
      getOrientation: (d) => [0, 90 - (d.trueTrack ?? 0), 0] as [number, number, number],
      getColor: (d) =>
        d.onGround
          ? [148, 163, 184, 220] as [number, number, number, number]
          : [96, 165, 250, 255] as [number, number, number, number],
      sizeScale: aircraftScale,
      pickable: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      material: false as any,
      // Re-evaluate getPosition every animation frame via pulse
      updateTriggers: { getPosition: pulse },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states, pulse, activeLayersKey, aircraftScale])

  const allLayers = useMemo(
    () => {
      const base = [...staticLayers]
      if (aircraftLayer) base.push(aircraftLayer)
      base.push(...ringLayers)  // center dot + 3 expanding rings on top
      return base
    },
    [staticLayers, aircraftLayer, ringLayers]
  )

  // ── Click: handles airport/aircraft selection + deselect on background ───

  const onClick = useCallback(
    (info: PickingInfo) => {
      if (!info.object) {
        selectAirport(null)
        selectAircraft(null)
        return
      }
      if (info.layer?.id === 'airports') {
        selectAirport(info.object as Airport)
      } else if (info.layer?.id === 'aircraft') {
        selectAircraft(info.object as AircraftState)
      }
    },
    [selectAirport, selectAircraft]
  )

  // ── Tooltip ───────────────────────────────────────────────────────────────

  const getTooltip = useCallback(({ object, layer }: PickingInfo) => {
    if (!object || !layer) return null

    if (layer.id === 'airports') {
      const a = object as Airport
      return {
        html: `<div style="line-height:1.5">
          <b style="font-size:14px">${a.iata ?? a.icao}</b>&nbsp;
          <span style="color:#94a3b8;font-size:10px;font-family:monospace">${a.iata ? a.icao : ''}</span><br/>
          ${a.name}<br/>
          ${a.municipality ? `<span style="color:#64748b;font-size:10px">${a.municipality}</span><br/>` : ''}
          ${a.udanServed ? '<span style="color:#fb923c;font-size:10px">● UDAN Served</span> ' : ''}
          ${a.scheduledService ? '<span style="color:#22c55e;font-size:10px">● Scheduled</span>' : ''}
        </div>`,
        style: TOOLTIP_STYLE as Partial<CSSStyleDeclaration>,
      }
    }

    if (layer.id === 'aircraft') {
      const s = object as AircraftState
      const altFt = s.baroAltitude
        ? Math.round(s.baroAltitude * 3.281).toLocaleString() + ' ft'
        : 'Ground'
      const speedKt = s.velocity ? Math.round(s.velocity * 1.944) + ' kt' : ''
      return {
        html: `<div style="line-height:1.6">
          <b style="color:#60a5fa;font-family:monospace;font-size:13px">${s.callsign?.trim() || s.icao24}</b><br/>
          ${altFt}${speedKt ? ' · ' + speedKt : ''}<br/>
          <span style="color:#475569;font-size:10px">${s.originCountry}</span>
        </div>`,
        style: TOOLTIP_STYLE as Partial<CSSStyleDeclaration>,
      }
    }

    return null
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse 130% 90% at 52% 52%, #071e3d 0%, #040e20 35%, #020810 70%, #010608 100%)',
    }}>
      <DeckGL
        views={GLOBE_VIEW}
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) =>
          setViewState(vs as ViewState)
        }
        controller={true}
        layers={allLayers}
        getTooltip={getTooltip}
        onClick={onClick}
        style={{ position: 'absolute', inset: '0' }}
      />
    </div>
  )
}
