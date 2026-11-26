import { schedule, type ScheduledTask } from 'node-cron'
import { refreshAllWeather } from '../services/owm.service'
import { logger } from '../utils/logger'

export function startPollWeather(): ScheduledTask {
  const task = schedule(
    '0 * * * *',
    async () => {
      logger.info('Refreshing airport weather...')
      try {
        await refreshAllWeather()
      } catch (err) {
        logger.error('Weather refresh failed', { error: (err as Error).message })
      }
    },
    { name: 'poll-weather' }
  )

  logger.info('Scheduled: weather refresh every 60 min')

  return task
}
