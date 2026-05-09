import { Router, Request, Response, NextFunction } from 'express'
import { UDANTraffic } from '../models/UDANTraffic'
import { Airport } from '../models/Airport'

export const udanRouter = Router()

// GET /udan/traffic?city=&year=&month=
udanRouter.get('/traffic', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = {}
    if (req.query.city) filter.city = req.query.city
    if (req.query.year) filter.year = parseInt(req.query.year as string, 10)
    if (req.query.month) filter.month = parseInt(req.query.month as string, 10)

    const data = await UDANTraffic.find(filter).lean().limit(500)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// GET /udan/gap-airports — airports where udanServed=true AND no recent flights
udanRouter.get('/gap-airports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const idleAirports = await Airport.find({
      udanServed: true,
      $or: [
        { lastSeenFlight: { $lt: thirtyDaysAgo } },
        { lastSeenFlight: null },
        { lastSeenFlight: { $exists: false } },
      ],
    })
      .lean()
      .limit(200)

    res.json(idleAirports)
  } catch (err) {
    next(err)
  }
})
