import axios from 'axios'
import { parse } from 'csv-parse/sync'
import { FIRMSHotspot } from '../models/FIRMSHotspot'
import { Airport } from '../models/Airport'
import { emitFIRMSAlert } from '../socket/gateway'
import { logger } from '../utils/logger'
import { env } from '../config/env'

interface FIRMSRow {
  latitude: string
  longitude: string
  brightness: string
  scan: string
  track: string
  acq_date: string
  acq_time: string
  satellite: string
  confidence: string
  version: string
  bright_t31: string
  frp: string
  daynight: string
}

const NEAR_AIRPORT_KM = 50

export async function loadFIRMSHotspots(): Promise<number> {
  if (!env.FIRMS_MAP_KEY) {
    logger.warn('FIRMS_MAP_KEY not set, skipping FIRMS fetch')
    return 0
  }

  const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${env.FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/IND/1`

  const res = await axios.get<string>(url, { responseType: 'text', timeout: 30_000 })
  const rows = parse(res.data, { columns: true, skip_empty_lines: true }) as FIRMSRow[]

  let count = 0
  for (const row of rows) {
    const lat = parseFloat(row.latitude)
    const lon = parseFloat(row.longitude)
    if (isNaN(lat) || isNaN(lon)) continue

    const nearest = await Airport.findOne({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $maxDistance: NEAR_AIRPORT_KM * 1000,
        },
      },
    }).lean()

    const doc = {
      latitude: lat,
      longitude: lon,
      brightness: parseFloat(row.brightness),
      scan: parseFloat(row.scan),
      track: parseFloat(row.track),
      acqDate: row.acq_date,
      acqTime: row.acq_time,
      satellite: row.satellite,
      confidence: row.confidence,
      version: row.version,
      brightT31: parseFloat(row.bright_t31),
      frp: parseFloat(row.frp),
      daynight: row.daynight,
      location: { type: 'Point' as const, coordinates: [lon, lat] as [number, number] },
      nearAirportIcao: nearest?.icao,
      nearAirportDistanceKm: nearest ? undefined : undefined,
    }

    await FIRMSHotspot.findOneAndUpdate(
      { acqDate: row.acq_date, acqTime: row.acq_time, latitude: lat, longitude: lon },
      { $set: doc },
      { upsert: true }
    )

    if (nearest && row.confidence === 'high') {
      emitFIRMSAlert(nearest.icao, doc)
    }

    count++
  }

  logger.info(`FIRMS: loaded ${count} hotspots`)
  return count
}
