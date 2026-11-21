import { schedule } from 'node-cron'
import { loadFIRMSHotspots } from '../services/firms.service'
import { logger } from '../utils/logger'

export function startPollFIRMS() {
  schedule(
    '*/30 * * * *',
    async () => {
      logger.info('Polling NASA FIRMS...')
      try {
        const count = await loadFIRMSHotspots()
        logger.info(`FIRMS poll complete: ${count} hotspots`)
      } catch (err) {
        logger.error('FIRMS poll failed', { error: (err as Error).message })
      }
    },
    { name: 'poll-firms' }
  )

  logger.info('Scheduled: FIRMS poll every 30 min')
}
