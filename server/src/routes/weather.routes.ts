import { Router, Request, Response, NextFunction } from 'express'
import { WeatherCache } from '../models/WeatherCache'
import { Airport } from '../models/Airport'
import { fetchWeatherForAirport } from '../services/owm.service'

export const weatherRouter = Router()

// GET /weather/fog?bbox=lamin,lomin,lamax,lomax
weatherRouter.get('/fog', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const fogDocs = await WeatherCache.find({
      updatedAt: { $gte: cutoff },
      $or: [
        { wxCode: { $in: ['FG', 'BR', 'HZ'] } },
        { visibility: { $lte: 3000 } },
        { rvr: { $exists: true } },
      ],
    }).lean()

    if (fogDocs.length === 0) {
      res.json([])
      return
    }

    const icaos = fogDocs.map((d) => d.icao)
    const airportQuery: Record<string, unknown> = { icao: { $in: icaos } }

    if (req.query.bbox) {
      const parts = (req.query.bbox as string).split(',').map(Number)
      if (parts.length === 4) {
        const [lamin, lomin, lamax, lomax] = parts
        airportQuery.location = {
          $geoWithin: {
            $box: [[lomin, lamin], [lomax, lamax]],
          },
        }
      }
    }

    const airports = await Airport.find(airportQuery).select('icao location').lean()
    const airportMap = new Map(airports.map((a) => [a.icao, a]))

    const results = fogDocs.flatMap((doc) => {
      const ap = airportMap.get(doc.icao)
      if (!ap) return []

      const rvrValues = doc.rvr && typeof doc.rvr === 'object'
        ? Object.values(doc.rvr as Record<string, number>).filter((v) => Number.isFinite(v))
        : []
      const rvrMin = rvrValues.length ? Math.min(...(rvrValues as number[])) : undefined

      return [
        {
          icao: doc.icao,
          latitude: ap.location.coordinates[1],
          longitude: ap.location.coordinates[0],
          visibility: doc.visibility,
          wxCode: doc.wxCode,
          rvrMin,
          updatedAt: doc.updatedAt,
        },
      ]
    })

    res.json(results)
  } catch (err) {
    next(err)
  }
})

// GET /weather/:icao
weatherRouter.get('/:icao', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const icao = (req.params.icao as string).toUpperCase()
    const cached = await WeatherCache.findOne({ icao }).lean()

    if (cached && Date.now() - new Date(cached.updatedAt).getTime() < 600_000) {
      res.json(cached)
      return
    }

    const airport = await Airport.findOne({ icao }).lean()
    if (!airport) {
      res.status(404).json({ error: 'Airport not found' })
      return
    }

    const [lon, lat] = airport.location.coordinates
    await fetchWeatherForAirport(icao, lat, lon)

    const fresh = await WeatherCache.findOne({ icao }).lean()
    res.json(fresh ?? { icao, error: 'Weather unavailable' })
  } catch (err) {
    next(err)
  }
})
