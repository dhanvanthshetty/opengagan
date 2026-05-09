import axios from 'axios'
import { parse } from 'csv-parse/sync'
import { Airport } from '../models/Airport'
import { logger } from '../utils/logger'
import { OURAIRPORTS_CSV_URL } from '../../../shared/src/constants/india'

interface OurAirportsRow {
  id: string
  ident: string
  type: string
  name: string
  latitude_deg: string
  longitude_deg: string
  elevation_ft: string
  continent: string
  iso_country: string
  iso_region: string
  municipality: string
  scheduled_service: string
  gps_code: string
  iata_code: string
  local_code: string
  home_link: string
  wikipedia_link: string
  keywords: string
}

export async function loadOurAirports(): Promise<{ inserted: number; updated: number }> {
  logger.info('Fetching OurAirports CSV...')
  const response = await axios.get<string>(OURAIRPORTS_CSV_URL, { responseType: 'text', timeout: 30_000 })

  const rows = parse(response.data, {
    columns: true,
    skip_empty_lines: true,
  }) as OurAirportsRow[]

  const indiaRows = rows.filter((r) => r.iso_country === 'IN' && r.ident)

  logger.info(`Found ${indiaRows.length} Indian airports in OurAirports CSV`)

  const ops = indiaRows.map((r) => {
    const lat = parseFloat(r.latitude_deg)
    const lon = parseFloat(r.longitude_deg)
    const elevFt = r.elevation_ft ? parseInt(r.elevation_ft, 10) : undefined

    return {
      updateOne: {
        filter: { icao: r.ident },
        update: {
          $set: {
            icao: r.ident,
            iata: r.iata_code || undefined,
            name: r.name,
            municipality: r.municipality || undefined,
            type: r.type as IAirportType,
            scheduledService: r.scheduled_service === 'yes',
            location: {
              type: 'Point' as const,
              coordinates: [lon, lat],
            },
            elevationFt: isNaN(elevFt as number) ? undefined : elevFt,
            country: 'IN',
            wikipediaLink: r.wikipedia_link || undefined,
          },
        },
        upsert: true,
      },
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await Airport.bulkWrite(ops as any[])

  logger.info(`OurAirports upsert complete`, {
    inserted: result.upsertedCount,
    modified: result.modifiedCount,
  })

  return { inserted: result.upsertedCount, updated: result.modifiedCount }
}

type IAirportType = 'large_airport' | 'medium_airport' | 'small_airport' | 'heliport' | 'seaplane_base' | 'closed'
