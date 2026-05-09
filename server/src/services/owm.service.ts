import axios from 'axios'
import { WeatherCache } from '../models/WeatherCache'
import { Airport } from '../models/Airport'
import { logger } from '../utils/logger'
import { env } from '../config/env'

interface OWMResponse {
  visibility?: number
  wind?: { speed?: number; deg?: number }
  main?: { temp?: number; humidity?: number }
  weather?: Array<{ description?: string; main?: string }>
  dt: number
}

export async function fetchWeatherForAirport(icao: string, lat: number, lon: number): Promise<void> {
  if (!env.OWM_API_KEY) return

  try {
    const res = await axios.get<OWMResponse>(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: { lat, lon, appid: env.OWM_API_KEY, units: 'metric' },
        timeout: 8_000,
      }
    )

    const d = res.data
    await WeatherCache.findOneAndUpdate(
      { icao },
      {
        $set: {
          icao,
          visibility: d.visibility,
          windSpeed: d.wind?.speed,
          windDir: d.wind?.deg,
          temperature: d.main?.temp,
          humidity: d.main?.humidity,
          description: d.weather?.[0]?.description,
          wxCode: d.weather?.[0]?.main,
          updatedAt: new Date(),
          source: 'owm',
        },
      },
      { upsert: true }
    )
  } catch (err) {
    logger.debug(`OWM fetch failed for ${icao}`, { error: (err as Error).message })
  }
}

export async function refreshAllWeather(): Promise<void> {
  const airports = await Airport.find({ scheduledService: true }).select('icao location').lean()
  logger.info(`Refreshing weather for ${airports.length} airports`)

  for (let i = 0; i < airports.length; i++) {
    const a = airports[i]
    const [lon, lat] = a.location.coordinates
    await fetchWeatherForAirport(a.icao, lat, lon)
    if (i % 55 === 54) await new Promise((r) => setTimeout(r, 60_000))
  }
}
