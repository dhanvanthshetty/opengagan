import { Router, Request, Response, NextFunction } from 'express'
import { Route } from '../models/Route'
import { Airport } from '../models/Airport'

export const routesRouter = Router()

function euclidDist(lon1: number, lat1: number, lon2: number, lat2: number) {
  return Math.hypot(lon2 - lon1, lat2 - lat1)
}

// Tier-1 hub ICAOs — every UDAN spoke connects to its nearest 2 hubs
const INDIA_HUBS = ['VIDP', 'VABB', 'VOMM', 'VOBL', 'VECC', 'VOHS', 'VAAH']

// Known UDAN-served / regional airport ICAOs (OurAirports + RCS UDAN list)
// These are the spoke airports that get connected to the nearest major hubs.
const UDAN_SPOKE_ICAOS = new Set([
  // Andhra Pradesh / Telangana
  'VOCP','VOKU','VORY','VOTP','VOBZ',
  // Tamil Nadu / Kerala / Karnataka
  'VOCB','VOCL','VOCI','VOKN','VOMD','VOML','VOMY','VOTK','VOTR','VOTV','VOPC','VOGB',
  // Port Blair
  'VOPB',
  // Gujarat / Maharashtra
  'VA1G','VA1P','VA2C','VAAU','VABJ','VABM','VABO','VABP','VABV',
  'VAHB','VAHS','VAID','VAJB','VAJL','VAJM','VAKE','VAKJ','VAKP','VAKS',
  'VALT','VAND','VANP','VAOZ','VAPO','VAPR','VARP','VASD','VASU',
  // North India
  'VIDP',  // Delhi is also a spoke to other hubs when hubs differ
  'VIAG','VIBK','VICG','VIDN','VIGR','VIJP','VIJR','VIKG','VIKO','VILK',
  'VIPT','VIPK','VISR','VIST','VIUT',
  // Northeast India
  'VEAB','VEAG','VEAL','VEBD','VEBI','VEBS','VECA','VECX','VEDZ','VEGY',
  'VEHA','VEHO','VEJP','VEJR','VELP','VEMN','VEMR','VEPH','VERC','VESD',
  'VETJ','VETK','VEZO',
  // Odisha / Jharkhand / Chhattisgarh
  'VEBS','VECA','VEJH','VERK','VERP',
  // Jammu & Kashmir / Himachal
  'VIBN','VIBR','VIJM','VILH','VISR',
  // Goa
  'VOGO','VOGA',
  // Lakshadweep
  'VOAT',
  // Jagdalpur etc
  'IN-JGB','IN-0393','IN-0308',
])

// GET /routes?origin=VOBG&dest=VIDP
// Returns routes with origin/dest lat-lon for globe arc rendering.
// Falls back to dynamically-derived UDAN spoke routes when Route collection is empty.
routesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = {}
    if (req.query.origin) filter.originIcao = (req.query.origin as string).toUpperCase()
    if (req.query.dest) filter.destIcao = (req.query.dest as string).toUpperCase()
    if (req.query.carrier) filter.carrier = req.query.carrier

    const routes = await Route.find(filter).lean().limit(300)

    if (routes.length > 0) {
      const icaos = new Set<string>()
      routes.forEach((r) => { icaos.add(r.originIcao); icaos.add(r.destIcao) })

      const airports = await Airport.find({ icao: { $in: [...icaos] } })
        .select('icao iata location udanServed')
        .lean()
      const airportMap = new Map(airports.map((a) => [a.icao, a]))

      const enriched = routes
        .map((r) => {
          const origin = airportMap.get(r.originIcao)
          const dest = airportMap.get(r.destIcao)
          if (!origin || !dest) return null
          return {
            _id: r._id,
            originIcao: r.originIcao,
            destIcao: r.destIcao,
            originIata: r.originIata ?? origin.iata,
            destIata: r.destIata ?? dest.iata,
            carrier: r.carrier,
            passengers: r.monthlyPassengers ?? 10000,
            year: r.year,
            month: r.month,
            originLat: origin.location.coordinates[1],
            originLon: origin.location.coordinates[0],
            destLat: dest.location.coordinates[1],
            destLon: dest.location.coordinates[0],
            isUdan: Boolean(origin.udanServed || dest.udanServed),
          }
        })
        .filter(Boolean)

      res.json(enriched)
      return
    }

    // When Route collection is empty, build hub-and-spoke arcs using the known
    // UDAN / regional airport ICAOs.  Synthesised on the fly, never written to DB.
    const [udanAirports, hubAirports] = await Promise.all([
      Airport.find({ icao: { $in: [...UDAN_SPOKE_ICAOS] } })
        .select('icao iata location municipality').lean(),
      Airport.find({ icao: { $in: INDIA_HUBS } }).select('icao iata location').lean(),
    ])

    if (hubAirports.length === 0) {
      res.json([])
      return
    }

    // Sort hubs by distance and pick nearest two
    const derived = udanAirports.flatMap((ap) => {
      if (INDIA_HUBS.includes(ap.icao)) return []
      const [aLon, aLat] = ap.location.coordinates

      const sorted = hubAirports
        .map((h) => ({
          hub: h,
          dist: euclidDist(aLon, aLat, h.location.coordinates[0], h.location.coordinates[1]),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2)

      return sorted.map(({ hub }) => ({
        originIcao: ap.icao,
        destIcao: hub.icao,
        originIata: ap.iata,
        destIata: hub.iata,
        passengers: 8000,
        isUdan: true,
        originLat: aLat,
        originLon: aLon,
        destLat: hub.location.coordinates[1],
        destLon: hub.location.coordinates[0],
      }))
    })

    // Add hub ↔ hub trunk routes so the big metros are visibly connected
    const hubRoutes: object[] = []
    for (let i = 0; i < hubAirports.length; i++) {
      for (let j = i + 1; j < hubAirports.length; j++) {
        const a = hubAirports[i]
        const b = hubAirports[j]
        hubRoutes.push({
          originIcao: a.icao, destIcao: b.icao,
          originIata: a.iata, destIata: b.iata,
          passengers: 50000, isUdan: false,
          originLat: a.location.coordinates[1], originLon: a.location.coordinates[0],
          destLat: b.location.coordinates[1],   destLon: b.location.coordinates[0],
        })
      }
    }

    res.json([...hubRoutes, ...derived])
  } catch (err) {
    next(err)
  }
})
