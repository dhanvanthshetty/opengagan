import { schedule, type ScheduledTask } from 'node-cron'
import { loadVonterUDAN } from '../services/vonterUDAN.loader'
import { logger } from '../utils/logger'

export function startMonthlyUDAN(): ScheduledTask {
  const task = schedule(
    '30 21 28-31 * *',
    async () => {
      const d = new Date()
      if (d.getUTCDate() !== 1) return
      logger.info('Starting monthly UDAN data refresh...')
      try {
        const result = await loadVonterUDAN()
        logger.info('Monthly UDAN refresh complete', result)
      } catch (err) {
        logger.error('Monthly UDAN refresh failed', { error: (err as Error).message })
      }
    },
    { name: 'monthly-udan' }
  )

  logger.info('Scheduled: monthly UDAN refresh on 1st of month')

  return task
}
