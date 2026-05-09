import axios from 'axios'
import { logger } from '../utils/logger'
import type { StateVector } from '../../../shared/src/index'
import regPrefixesJson from '../../../shared/src/data/reg-prefixes.json'
const REG_PREFIX_COUNTRY = regPrefixesJson as Record<string, string>

const BASE = 'https://api.airplanes.live/v2/point'
const REGIONS = [
  { lat: 28.6, lon:  77.2 },
  { lat: 13.0, lon:  80.3 },
  { lat: 23.0, lon:  72.5 },
  { lat: 22.5, lon:  88.4 },
  { lat: 25.3, lon:  55.4 },
  { lat: 24.9, lon:  67.2 },
  { lat: 24.7, lon:  46.7 },
  { lat: 33.3, lon:  44.4 },
  { lat: 51.5, lon:   0.1 },
  { lat: 48.9, lon:   2.4 },
  { lat: 50.0, lon:   8.6 },
  { lat: 52.4, lon:   4.9 },
  { lat: 41.0, lon:  29.0 },
  { lat: 22.3, lon: 113.9 },
  { lat:  1.3, lon: 103.8 },
  { lat: 35.7, lon: 139.7 },
  { lat: 37.5, lon: 126.9 },
  { lat: 31.2, lon: 121.5 },
  { lat: 39.9, lon: 116.4 },
  { lat: 13.7, lon: 100.5 },
  { lat: 40.7, lon: -74.0 },
  { lat: 34.0, lon:-118.2 },
  { lat: 41.9, lon: -87.6 },
  { lat: 33.7, lon: -84.4 },
  { lat: 30.1, lon:  31.4 },
  { lat:-33.9, lon: 151.2 },
] as const
const RADIUS_NM = 250

function countryFromRegistration(reg?: string): string {
  if (!reg) return 'Unknown'
  const r = reg.toUpperCase().replace(/[^A-Z0-9]/g, '')
  for (let len = 4; len >= 1; len--) {
    const prefix = r.slice(0, len)
    if (REG_PREFIX_COUNTRY[prefix]) return REG_PREFIX_COUNTRY[prefix]
  }
  return 'Unknown'
}

interface AirplanesLiveAircraft {
  hex: string
  flight?: string
  r?: string
  lat?: number
  lon?: number
  alt_baro?: number | 'ground'
  gs?: number
  track?: number
  baro_rate?: number
  squawk?: string
  on_ground?: boolean
}

interface AirplanesLiveResponse {
  ac: AirplanesLiveAircraft[]
}

export const adsbLolService = {
  async getStates(): Promise<StateVector[]> {
    try {
      const results = await Promise.allSettled(
        REGIONS.map((r) =>
          axios.get<AirplanesLiveResponse>(`${BASE}/${r.lat}/${r.lon}/${RADIUS_NM}`, {
            timeout: 10_000,
          })
        )
      )

      const seen = new Set<string>()
      const merged: AirplanesLiveAircraft[] = []

      for (const result of results) {
        if (result.status !== 'fulfilled') continue
        for (const ac of result.value.data?.ac ?? []) {
          if (!ac.hex || seen.has(ac.hex)) continue
          seen.add(ac.hex)
          merged.push(ac)
        }
      }

      return merged
        .filter((a) => a.lat != null && a.lon != null)
        .map((a) => ({
          icao24: a.hex,
          callsign: a.flight?.trim() ?? null,
          originCountry: countryFromRegistration(a.r),
          timePosition: null,
          lastContact: Date.now() / 1000,
          longitude: a.lon ?? null,
          latitude: a.lat ?? null,
          baroAltitude: a.alt_baro === 'ground' ? 0 : (a.alt_baro ?? null),
          onGround: a.alt_baro === 'ground' || a.on_ground === true,
          velocity: a.gs != null ? a.gs * 0.514444 : null,
          trueTrack: a.track ?? null,
          verticalRate: a.baro_rate != null ? a.baro_rate * 0.00508 : null,
          sensors: null,
          geoAltitude: null,
          squawk: a.squawk ?? null,
          spi: false,
          positionSource: 0,
        }))
    } catch (err) {
      logger.warn('airplanes.live fallback failed', { error: (err as Error).message })
      return []
    }
  },
}
