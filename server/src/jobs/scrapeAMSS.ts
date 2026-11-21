import { schedule } from 'node-cron'
import { scrapeAMSSDelhi } from '../services/amssDelhi.scraper'
import { logger } from '../utils/logger'

export function startScrapeAMSS() {
  schedule(
    '*/10 * * * *',
    async () => {
      try {
        await scrapeAMSSDelhi()
      } catch (err) {
        logger.error('AMSS scrape error', { error: (err as Error).message })
      }
    },
    { name: 'scrape-amss' }
  )

  logger.info('Scheduled: AMSS Delhi scrape every 10 min')
}
