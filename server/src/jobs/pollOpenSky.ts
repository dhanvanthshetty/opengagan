import cron from 'node-cron'
import { Server as SocketIOServer } from 'socket.io'
import { AircraftState } from '../models/AircraftState'
import { Airport } from '../models/Airport'
import { openSkyService } from '../services/opensky.service'
import { adsbLolService } from '../services/adsblol.service'
import { emitStates } from '../socket/gateway'
import { logger } from '../utils/logger'
import { env } from '../config/env'
import { OPENSKY_POLL_START_IST, OPENSKY_POLL_END_IST } from '../../../shared/src/constants/opensky'
import { IST_OFFSET_HOURS } from '../../../shared/src/constants/india'
import type { StateVector } from '../../../shared/src/index'

let lastEmptyLogAt = 0
let openSkyCooldownUntil = 0

export function startPollOpenSky(_io: SocketIOServer) {
  const pollSeconds = Math.min(60, Math.max(5, env.OPENSKY_POLL_SECONDS))
  const cronExpr = `*/${pollSeconds} * * * * *`

  cron.schedule(cronExpr, async () => {
    const now = new Date()
    const istHour =
      (now.getUTCHours() + now.getUTCMinutes() / 60 + IST_OFFSET_HOURS) % 24
    if (!env.OPENSKY_POLL_ALL_DAY) {
      if (istHour < OPENSKY_POLL_START_IST || istHour > OPENSKY_POLL_END_IST) return
    }

    let states: StateVector[] = []
    let source = 'opensky'

    if (Date.now() >= openSkyCooldownUntil) {
      try {
        states = await openSkyService.getStates()
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response?.status
        if (status === 429) {
          const retryAfter = Number(
            (err as { response?: { headers?: Record<string, string> } })
              .response?.headers?.['retry-after']
          )
          const cooldownMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 60_000
          openSkyCooldownUntil = Date.now() + cooldownMs
          logger.warn('OpenSky rate limited, will use fallback', {
            retryInSec: Math.round(cooldownMs / 1000),
          })
        } else {
          logger.warn(`OpenSky failed (${status ?? 'network'}), using airplanes.live fallback`)
        }
      }
    }

    if (states.length === 0) {
      source = 'airplanes.live'
      states = (await adsbLolService.getStates()).filter(
        (s) => s.latitude != null && s.longitude != null
      )
    }

    const validStates = states.filter((s) => s.latitude != null && s.longitude != null)

    if (validStates.length === 0) {
      const nowMs = Date.now()
      if (nowMs - lastEmptyLogAt > 60_000) {
        lastEmptyLogAt = nowMs
        logger.warn(`No valid aircraft states from ${source}`)
      }
      return
    }

    const ops = validStates.map((s) => ({
      updateOne: {
        filter: { icao24: s.icao24 },
        update: {
          $set: {
            icao24: s.icao24,
            callsign: s.callsign?.trim() ?? '',
            originCountry: s.originCountry,
            latitude: s.latitude!,
            longitude: s.longitude!,
            baroAltitude: s.baroAltitude ?? 0,
            velocity: s.velocity ?? 0,
            trueTrack: s.trueTrack ?? 0,
            verticalRate: s.verticalRate ?? 0,
            onGround: s.onGround,
            timePosition: s.timePosition ?? null,
            lastContact: s.lastContact ?? null,
            geoAltitude: s.geoAltitude ?? null,
            squawk: s.squawk ?? null,
            spi: s.spi ?? false,
            positionSource: s.positionSource ?? null,
            sensors: s.sensors ?? null,
            timestamp: new Date(),
            location: {
              type: 'Point',
              coordinates: [s.longitude!, s.latitude!],
            },
          },
        },
        upsert: true,
      },
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await AircraftState.bulkWrite(ops as any[])

    const airportIcaos = new Set(validStates.map((s) => s.callsign?.substring(2, 5)).filter(Boolean))
    if (airportIcaos.size > 0) {
      await Airport.updateMany(
        { iata: { $in: [...airportIcaos] } },
        { $set: { lastSeenFlight: new Date() } }
      )
    }

    emitStates(validStates)
    logger.info(`${source}: ${validStates.length} aircraft over India`)
  })

  logger.info(`Scheduled: OpenSky poll every ${pollSeconds}s (06:00–22:00 IST)`)
  if (env.OPENSKY_POLL_ALL_DAY) {
    logger.info('OpenSky poll window override: OPENSKY_POLL_ALL_DAY=true')
  }
}
