import { Router, Request, Response, NextFunction } from 'express'
import { AircraftState } from '../models/AircraftState'

export const statesRouter = Router()

statesRouter.get('/live', (req: Request, res: Response, _next: NextFunction) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const sendStates = async () => {
    try {
      const states = await AircraftState.find({
        timestamp: { $gte: new Date(Date.now() - 30_000) },
      }).lean()
      res.write(`data: ${JSON.stringify(states)}\n\n`)
    } catch {
      // ignore read errors
    }
  }

  sendStates()
  const interval = setInterval(sendStates, 10_000)

  req.on('close', () => {
    clearInterval(interval)
  })
})
