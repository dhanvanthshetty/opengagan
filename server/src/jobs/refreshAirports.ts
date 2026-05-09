import cron from 'node-cron'
import { loadOurAirports } from '../services/ourAirports.loader'
import { logger } from '../utils/logger'

export function startRefreshAirports() {
  cron.schedule('30 20 * * *', async () => {
    logger.info('Starting nightly airport refresh...')
    try {
      const result = await loadOurAirports()
      logger.info('Airport refresh complete', result)
    } catch (err) {
      logger.error('Airport refresh failed', { error: (err as Error).message })
    }
  })

  logger.info('Scheduled: nightly airport refresh at 2:00 AM IST')
}
