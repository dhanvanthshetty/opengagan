import axios from 'axios'
import { parse } from 'csv-parse/sync'
import { UDANTraffic } from '../models/UDANTraffic'
import { Airport } from '../models/Airport'
import { logger } from '../utils/logger'

const VONTER_BASE =
  'https://raw.githubusercontent.com/Vonter/india-aviation-traffic/main/data'

const UDAN_CITIES = new Set([
  'Agartala', 'Agatti', 'Agra', 'Ahmedabad', 'Ajmer', 'Allahabad', 'Amritsar',
  'Aurangabad', 'Azamgarh', 'Belgaum', 'Bhavnagar', 'Bhopal', 'Bhubaneswar',
  'Bikaner', 'Calicut', 'Chandigarh', 'Chennai', 'Coimbatore', 'Dehradun',
  'Dibrugarh', 'Dimapur', 'Diu', 'Goa', 'Gorakhpur', 'Guwahati', 'Gwalior',
  'Hubli', 'Hyderabad', 'Imphal', 'Indore', 'Jabalpur', 'Jaipur', 'Jammu',
  'Jamshedpur', 'Jodhpur', 'Jorhat', 'Kadapa', 'Kannur', 'Kochi', 'Kolkata',
  'Kurnool', 'Leh', 'Lucknow', 'Ludhiana', 'Madurai', 'Mangalore', 'Mumbai',
  'Muzaffarpur', 'Mysore', 'Nagpur', 'New Delhi', 'Pantnagar', 'Patna',
  'Pondicherry', 'Port Blair', 'Pune', 'Raipur', 'Rajkot', 'Ranchi',
  'Shillong', 'Shimla', 'Silchar', 'Srinagar', 'Surat', 'Tirupati',
  'Tiruchirapalli', 'Trivandrum', 'Tuticorin', 'Udaipur', 'Vadodara',
  'Varanasi', 'Vijayawada', 'Visakhapatnam',
])

interface VonterRow {
  month?: string
  year?: string
  city?: string
  airline?: string
  carrier?: string
  passengers?: string
  freight?: string
  [key: string]: string | undefined
}

export async function loadVonterUDAN(): Promise<{ inserted: number; updated: number }> {
  const year = new Date().getFullYear()
  let csvData = ''

  for (const y of [year, year - 1]) {
    try {
      const url = `${VONTER_BASE}/passengers-${y}.csv`
      const res = await axios.get<string>(url, { responseType: 'text', timeout: 30_000 })
      csvData = res.data
      logger.info(`Loaded Vonter CSV for year ${y}`)
      break
    } catch {
      logger.debug(`Vonter CSV not found for year ${y}`)
    }
  }

  if (!csvData) {
    logger.warn('Vonter CSV not available, skipping UDAN load')
    return { inserted: 0, updated: 0 }
  }

  const rows = parse(csvData, { columns: true, skip_empty_lines: true }) as VonterRow[]

  const ops = rows.map((row) => {
    const city = row.city ?? row['City'] ?? ''
    const carrier = row.airline ?? row.carrier ?? row['Airline'] ?? ''
    const month = parseInt(row.month ?? row['Month'] ?? '1', 10)
    const yr = parseInt(row.year ?? row['Year'] ?? String(year), 10)
    const passengers = parseInt(row.passengers ?? row['Passengers'] ?? '0', 10)
    const freight = parseFloat(row.freight ?? row['Freight'] ?? '0')

    return {
      updateOne: {
        filter: { city, carrier, month, year: yr },
        update: { $set: { city, carrier, month, year: yr, passengers, freight } },
        upsert: true,
      },
    }
  })

  const result = await UDANTraffic.bulkWrite(ops)

  const udanCities = rows
    .map((r) => r.city ?? '')
    .filter((c) => UDAN_CITIES.has(c))

  await Airport.updateMany(
    { municipality: { $in: udanCities } },
    { $set: { udanServed: true } }
  )

  logger.info('Vonter UDAN load complete', { inserted: result.upsertedCount, modified: result.modifiedCount })
  return { inserted: result.upsertedCount, updated: result.modifiedCount }
}
