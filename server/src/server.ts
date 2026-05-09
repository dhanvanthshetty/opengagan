import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import responseTime from 'response-time'
import { env } from './config/env'
import { connectDB } from './config/db'
import { logger } from './utils/logger'
import { helmetMiddleware } from './middleware/helmet'
import { compressionMiddleware } from './middleware/compression'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { errorHandler } from './middleware/errorHandler'
import { airportsRouter } from './routes/airports.routes'
import { carbonRouter } from './routes/carbon.routes'
import { rightsRouter } from './routes/rights.routes'
import { udanRouter } from './routes/udan.routes'
import { weatherRouter } from './routes/weather.routes'
import { firmsRouter } from './routes/firms.routes'
import { routesRouter } from './routes/routes.routes'
import { githubRouter } from './routes/github.routes'
import { initSocketGateway } from './socket/gateway'

export function createApp() {
  const app = express()

  app.use(helmetMiddleware)
  app.use(cors({ origin: env.FRONTEND_URL }))
  app.use(compressionMiddleware)
  app.use(responseTime())
  app.use(express.json({ limit: '100kb' }))
  app.use(rateLimitMiddleware)

  app.get('/health', async (_req, res) => {
    const { Airport } = await import('./models/Airport')
    const count = await Airport.countDocuments()
    res.json({ status: 'ok', airports: count, timestamp: new Date().toISOString() })
  })

  app.use('/airports', airportsRouter)
  app.use('/carbon', carbonRouter)
  app.use('/rights', rightsRouter)
  app.use('/udan', udanRouter)
  app.use('/weather', weatherRouter)
  app.use('/firms', firmsRouter)
  app.use('/routes', routesRouter)
  app.use('/github', githubRouter)

  app.use(errorHandler)

  return app
}

export function createHttpServer(app: ReturnType<typeof createApp>) {
  const httpServer = createServer(app)
  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.FRONTEND_URL },
  })
  initSocketGateway(io)
  return { httpServer, io }
}

async function main() {
  await connectDB()

  const app = createApp()
  const { httpServer, io } = createHttpServer(app)

  const { statesRouter } = await import('./routes/states.routes')
  app.use('/states', statesRouter)

  const { startPollOpenSky } = await import('./jobs/pollOpenSky')
  startPollOpenSky(io)

  const { startRefreshAirports } = await import('./jobs/refreshAirports')
  startRefreshAirports()

  const { startPollFIRMS } = await import('./jobs/pollFIRMS')
  startPollFIRMS()
  import('./services/firms.service').then(({ loadFIRMSHotspots }) =>
    loadFIRMSHotspots().catch((e) => logger.warn('Initial FIRMS poll failed', { error: e.message }))
  )

  const { startPollWeather } = await import('./jobs/pollWeather')
  startPollWeather()
  import('./services/owm.service').then(({ refreshAllWeather }) =>
    refreshAllWeather().catch((e) => logger.warn('Initial weather poll failed', { error: e.message }))
  )

  const { startScrapeAMSS } = await import('./jobs/scrapeAMSS')
  startScrapeAMSS()

  const { startMonthlyUDAN } = await import('./jobs/monthlyUDAN')
  startMonthlyUDAN()
  import('./services/vonterUDAN.loader').then(({ loadVonterUDAN }) =>
    loadVonterUDAN().catch((e) => logger.warn('Initial UDAN load failed', { error: e.message }))
  )

  httpServer.listen(env.PORT, () => {
    logger.info(`OpenGagan server running on port ${env.PORT}`)
  })
}

main().catch((err) => {
  logger.error('Fatal startup error', { error: err.message })
  process.exit(1)
})
