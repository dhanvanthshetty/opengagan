import mongoose from 'mongoose'
import { env } from './env'
import { logger } from '../utils/logger'

let retries = 0
const MAX_RETRIES = 5

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected')
    retries = 0
  })

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected')
  })

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error', { error: err.message })
  })

  await tryConnect()
}

async function tryConnect(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI)
  } catch (err) {
    retries++
    const delay = Math.min(1000 * 2 ** retries, 30_000)
    logger.warn(`MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}), retrying in ${delay}ms`)
    if (retries >= MAX_RETRIES) {
      logger.error('MongoDB connection failed after max retries')
      process.exit(1)
    }
    await new Promise((r) => setTimeout(r, delay))
    return tryConnect()
  }
}
