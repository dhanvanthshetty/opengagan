import { Router, Request, Response, NextFunction } from 'express'
import { Airport } from '../models/Airport'
import { haversineWithUplift } from '../utils/haversine'
import { calcCO2 } from '../utils/carbon'

export const carbonRouter = Router()

// In-memory 24hr cache (route distance never changes)
const cache = new Map<string, { result: unknown; ts: number }>()
const TTL = 24 * 60 * 60 * 1000

// GET /carbon?origin=BLR&dest=DEL&pax=1
carbonRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const origin = (req.query.origin as string)?.toUpperCase()
    const dest = (req.query.dest as string)?.toUpperCase()
    const pax = Math.max(1, parseInt((req.query.pax as string) ?? '1', 10))

    if (!origin || !dest) {
      res.status(400).json({ error: 'origin and dest are required (IATA codes)' })
      return
    }

    const key = `${origin}-${dest}-${pax}`
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < TTL) {
      res.json(cached.result)
      return
    }

    const [originAirport, destAirport] = await Promise.all([
      Airport.findOne({ iata: origin }).lean(),
      Airport.findOne({ iata: dest }).lean(),
    ])

    if (!originAirport) {
      res.status(404).json({ error: `Origin airport '${origin}' not found` })
      return
    }
    if (!destAirport) {
      res.status(404).json({ error: `Destination airport '${dest}' not found` })
      return
    }

    const [originLon, originLat] = originAirport.location.coordinates
    const [destLon, destLat] = destAirport.location.coordinates

    const distanceKm = haversineWithUplift(originLat, originLon, destLat, destLon)
    const { co2Kg, co2PerPax, treesNeeded, drivingEquivalentKm } = calcCO2(distanceKm, pax)

    const result = {
      origin,
      destination: dest,
      distanceKm: Math.round(distanceKm),
      co2Kg,
      co2PerPax,
      treesNeeded,
      drivingEquivalentKm,
      pax,
    }

    cache.set(key, { result, ts: Date.now() })
    res.json(result)
  } catch (err) {
    next(err)
  }
})
