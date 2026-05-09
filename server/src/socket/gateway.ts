import { Server as SocketIOServer } from 'socket.io'
import { AircraftState } from '../models/AircraftState'
import { logger } from '../utils/logger'

let io: SocketIOServer

export function initSocketGateway(socketServer: SocketIOServer) {
  io = socketServer

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`)

    AircraftState.find({ timestamp: { $gte: new Date(Date.now() - 15_000) } })
      .lean()
      .then((states) => socket.emit('states:init', states))
      .catch(() => socket.emit('states:init', []))

    socket.on('watch:airport', (icao: string) => {
      if (typeof icao === 'string' && icao.length <= 8) {
        socket.join(`airport:${icao.toUpperCase()}`)
      }
    })

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`)
    })
  })
}

export function emitStates(states: unknown[]) {
  io?.emit('states', states)
}

export function emitFogAlert(icao: string, rvr: number) {
  io?.to(`airport:${icao}`).emit('alert:fog', { icao, rvr, ts: Date.now() })
}

export function emitFIRMSAlert(icao: string, hotspot: unknown) {
  io?.to(`airport:${icao}`).emit('alert:firms', { icao, hotspot })
}
