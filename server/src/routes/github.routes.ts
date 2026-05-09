import { Router, Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { logger } from '../utils/logger'

export const githubRouter = Router()

interface CommitInfo { sha: string; date: string }
interface FreshnessCache { ourAirports: CommitInfo; vonter: CommitInfo; ts: number }

let cache: FreshnessCache | null = null
const TTL = 6 * 60 * 60 * 1000  // 6 hours

// GET /github/freshness — data provenance widget
githubRouter.get('/freshness', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (cache && Date.now() - cache.ts < TTL) {
      res.json(cache)
      return
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'OpenGagan/1.0',
    }

    const [ourAirportsRes, vonterRes] = await Promise.allSettled([
      axios.get(
        'https://api.github.com/repos/davidmegginson/ourairports-data/commits/main',
        { headers, timeout: 8_000 }
      ),
      axios.get(
        'https://api.github.com/repos/Vonter/india-aviation-traffic/commits/main',
        { headers, timeout: 8_000 }
      ),
    ])

    const getCommit = (result: PromiseSettledResult<{ data: { sha: string; commit: { author: { date: string } } } }>): CommitInfo => {
      if (result.status === 'fulfilled') {
        const d = result.value.data
        return { sha: d.sha.slice(0, 7), date: d.commit.author.date }
      }
      return { sha: 'unknown', date: new Date().toISOString() }
    }

    cache = {
      ourAirports: getCommit(ourAirportsRes as PromiseSettledResult<{ data: { sha: string; commit: { author: { date: string } } } }>),
      vonter: getCommit(vonterRes as PromiseSettledResult<{ data: { sha: string; commit: { author: { date: string } } } }>),
      ts: Date.now(),
    }

    res.json(cache)
  } catch (err) {
    logger.warn('GitHub freshness check failed', { error: (err as Error).message })
    next(err)
  }
})
