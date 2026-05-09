import { Router, Request, Response, NextFunction } from 'express'
import { FIRMSHotspot } from '../models/FIRMSHotspot'

export const firmsRouter = Router()

// GET /firms?bbox=lamin,lomin,lamax,lomax
firmsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: Record<string, unknown> = {}

    if (req.query.bbox) {
      const parts = (req.query.bbox as string).split(',').map(Number)
      if (parts.length === 4) {
        const [lamin, lomin, lamax, lomax] = parts
        query.location = {
          $geoWithin: {
            $box: [[lomin, lamin], [lomax, lamax]],
          },
        }
      }
    }

    // Return only last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    query.acqDate = { $gte: oneDayAgo }

    const hotspots = await FIRMSHotspot.find(query).lean().limit(500)
    res.json(hotspots)
  } catch (err) {
    next(err)
  }
})
