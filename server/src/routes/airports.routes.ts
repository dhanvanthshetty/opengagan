import { Router, Request, Response, NextFunction } from 'express'
import { Airport } from '../models/Airport'
import { logger } from '../utils/logger'

export const airportsRouter = Router()

type PhotoStatus = 'ok' | 'none' | 'rejected'
type PhotoResult = { url: string | null; source: string | null; status: PhotoStatus }

const photoCache = new Map<string, { url: string | null; source: string | null; status: PhotoStatus; ts: number }>()
const PHOTO_TTL = 6 * 60 * 60 * 1000
const PHOTO_DB_TTL = 7 * 24 * 60 * 60 * 1000
const PHOTO_DB_TTL_MISS = 6 * 60 * 60 * 1000

type ImgPage = { title?: string; imageinfo?: Array<{ url: string; thumburl?: string; mime: string; width: number }> }

function bestPhoto(pages: ImgPage[], minWidth = 500): string | null {
  const sorted = pages
    .filter(p => {
      const info = p.imageinfo?.[0]
      return info &&
        (info.mime === 'image/jpeg' || info.mime === 'image/png') &&
        (info.width ?? 0) >= minWidth
    })
    .sort((a, b) => (b.imageinfo![0].width ?? 0) - (a.imageinfo![0].width ?? 0))
  if (!sorted.length) return null
  const info = sorted[0].imageinfo![0]
  return info.thumburl ?? info.url
}

function wikiTitleFromUrl(url?: string): string | null {
  if (!url) return null
  const match = url.match(/\/wiki\/(.+)$/)
  if (!match) return null
  return decodeURIComponent(match[1]).replace(/_/g, ' ')
}

function commonsFileTitleFromUrl(url?: string): string | null {
  if (!url) return null
  const match = url.match(/Special:FilePath\/([^?#]+)/i)
  if (!match) return null
  return `File:${decodeURIComponent(match[1])}`
}

async function fetchCommonsFileUrl(
  titles: string[],
  minWidth: number,
  headers: Record<string, string>
): Promise<string | null> {
  if (!titles.length) return null
  const infoRes = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles.map(encodeURIComponent).join('|')}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1280&format=json`,
    { headers, signal: AbortSignal.timeout(6000) }
  )
  const infoData = await infoRes.json() as { query?: { pages?: Record<string, ImgPage> } }
  return bestPhoto(Object.values(infoData?.query?.pages ?? {}), minWidth)
}

async function fetchAirportPhoto(
  name: string,
  icao: string,
  iata?: string,
  wikipediaLink?: string
): Promise<PhotoResult> {
  const headers = { 'User-Agent': 'OpenGagan/1.0 (open-source aviation map; github.com/opengagan)' }
  const codes = [iata, icao].filter(Boolean) as string[]
  const airportKw = ['airport', 'terminal', 'runway', 'aerodrome', 'apron', 'departure', 'arrival', 'tarmac']
  const skipKw = ['flag', 'logo', 'icon', 'map', 'coat', 'seal', 'emblem', 'symbol', 'locator', 'blank', 'route']
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const strongTokens = normalize(name)
    .split(' ')
    .filter((t) => t.length >= 4 && !['airport', 'international', 'domestic'].includes(t))
    .slice(0, 2)
  const isRelevantTitle = (title?: string) => {
    const t = (title ?? '').toLowerCase()
    if (!t) return false
    if (skipKw.some((w) => t.includes(w))) return false
    return airportKw.some((w) => t.includes(w)) || codes.some((c) => t.includes(c.toLowerCase()))
  }
  const isStrongTitle = (title?: string) => {
    const t = normalize(title ?? '')
    if (!t) return false
    if (codes.some((c) => t.includes(c.toLowerCase()))) return true
    if (strongTokens.length === 0) return false
    return strongTokens.every((token) => t.includes(token))
  }

  try {
    const icaoValue = icao.toUpperCase()
    const iataValue = iata?.toUpperCase()
    const sparql = `SELECT ?commons ?image WHERE {
      { ?item wdt:P239 "${icaoValue}". }
      ${iataValue ? `UNION { ?item wdt:P238 "${iataValue}". }` : ''}
      OPTIONAL { ?item wdt:P373 ?commons. }
      OPTIONAL { ?item wdt:P18 ?image. }
    } LIMIT 1`
    const wdRes = await fetch(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`,
      { headers: { ...headers, Accept: 'application/json' }, signal: AbortSignal.timeout(6000) }
    )
    const wdData = await wdRes.json() as { results?: { bindings?: Array<{ commons?: { value: string }; image?: { value: string } }> } }
    const imageUrl = wdData?.results?.bindings?.[0]?.image?.value
    const imageTitle = commonsFileTitleFromUrl(imageUrl)
    if (imageTitle) {
      const url = await fetchCommonsFileUrl([imageTitle], 900, headers)
      if (url) return { url, source: 'wikidata-p18', status: 'ok' }
    }
    const commonsCategory = wdData?.results?.bindings?.[0]?.commons?.value
    if (commonsCategory) {
      const catRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(commonsCategory)}&gcmtype=file&gcmlimit=30&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=960&format=json`,
        { headers, signal: AbortSignal.timeout(6000) }
      )
      const catData = await catRes.json() as { query?: { pages?: Record<string, ImgPage> } }
      const pages = Object.values(catData?.query?.pages ?? {})
      const relevant = pages.filter((p) => isRelevantTitle(p.title))
      const safePages = pages.filter((p) => {
        const t = (p.title ?? '').toLowerCase()
        return !skipKw.some((w) => t.includes(w))
      })
      const candidates = relevant.length ? relevant : safePages
      const url = bestPhoto(candidates, 600)
      if (url) return { url, source: 'commons-category', status: 'ok' }
    }
  } catch { /* fall through */ }

  const queries = [
    iata ? `${iata} airport India` : null,
    `${icao} airport`,
    `${name} airport`,
  ].filter(Boolean) as string[]

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&gsrlimit=20&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=960&format=json`,
        { headers, signal: AbortSignal.timeout(6000) }
      )
      const data = await res.json() as { query?: { pages?: Record<string, ImgPage> } }
      const pages = Object.values(data?.query?.pages ?? {})
      const relevant = pages.filter((p) => isStrongTitle(p.title))
      const url = bestPhoto(relevant, 600)
      if (url) return { url, source: 'commons-search', status: 'ok' }
    } catch { /* try next */ }
  }

  try {
    const articleTitle = wikiTitleFromUrl(wikipediaLink)
    if (!articleTitle) return { url: null, source: null, status: 'none' }

    const imgsRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=images&imlimit=40&format=json`,
      { headers, signal: AbortSignal.timeout(5000) }
    )
    const imgsData = await imgsRes.json() as {
      query?: { pages?: Record<string, { images?: Array<{ title: string }> }> }
    }
    const allImages = Object.values(imgsData?.query?.pages ?? {})[0]?.images ?? []
    const photoFiles = allImages
      .filter(img => {
        const t = img.title.toLowerCase()
        return (t.endsWith('.jpg') || t.endsWith('.jpeg') || t.endsWith('.png')) &&
          isStrongTitle(t)
      })
      .slice(0, 10)
      .map(f => f.title)

    if (!photoFiles.length) return { url: null, source: null, status: 'none' }

    const infoRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${photoFiles.map(encodeURIComponent).join('|')}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=960&format=json`,
      { headers, signal: AbortSignal.timeout(5000) }
    )
    const infoData = await infoRes.json() as { query?: { pages?: Record<string, ImgPage> } }
    const url = bestPhoto(Object.values(infoData?.query?.pages ?? {}), 600)
    if (url) return { url, source: 'wikipedia', status: 'ok' }
  } catch { /* no photo found */ }

  return { url: null, source: null, status: 'none' }
}

airportsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10))
    const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) ?? '50', 10)))
    const skip = (page - 1) * limit
    const typeFilter = req.query.type as string | undefined

    const query: Record<string, unknown> = {}

    if (req.query.bbox) {
      const parts = (req.query.bbox as string).split(',').map(Number)
      if (parts.length === 4) {
        const [lamin, lomin, lamax, lomax] = parts
        query.location = {
          $geoWithin: {
            $box: [
              [lomin, lamin],
              [lomax, lamax],
            ],
          },
        }
      }
    }

    if (typeFilter) {
      query.type = typeFilter
    }

    const [airports, total] = await Promise.all([
      Airport.find(query).skip(skip).limit(limit).lean(),
      Airport.countDocuments(query),
    ])

    res.setHeader('X-Total-Count', total)
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count')
    res.json(airports)
  } catch (err) {
    next(err)
  }
})

airportsRouter.delete('/photo-cache', (_req: Request, res: Response) => {
  photoCache.clear()
  res.json({ cleared: true })
})

airportsRouter.get('/:icao/photo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const icao = (req.params.icao as string).toUpperCase()
    const refreshParam = String(req.query.refresh ?? '').toLowerCase()
    const forceRefresh = refreshParam === '1' || refreshParam === 'true' || refreshParam === 'yes'

    const cached = photoCache.get(icao)
    if (!forceRefresh && cached && Date.now() - cached.ts < PHOTO_TTL) {
      res.json({ url: cached.url, source: cached.source, status: cached.status })
      return
    }

    const airport = await Airport.findOne({ icao }).lean()
    if (!airport) {
      res.status(404).json({ url: null, source: null, status: 'none' })
      return
    }

    const updatedAt = airport.photoUpdatedAt ? new Date(airport.photoUpdatedAt) : null
    const dbStatus = (airport.photoStatus as PhotoStatus | undefined) ?? (airport.photoUrl ? 'ok' : 'none')
    const ttl = dbStatus === 'ok' ? PHOTO_DB_TTL : PHOTO_DB_TTL_MISS
    const dbFresh = updatedAt ? Date.now() - updatedAt.getTime() < ttl : false

    if (!forceRefresh && dbFresh) {
      const payload = {
        url: airport.photoUrl ?? null,
        source: airport.photoSource ?? null,
        status: dbStatus,
        updatedAt: updatedAt?.toISOString() ?? null,
      }
      photoCache.set(icao, { url: payload.url, source: payload.source, status: payload.status, ts: Date.now() })
      res.setHeader('Cache-Control', 'public, max-age=21600') // 6h browser cache
      res.json(payload)
      return
    }

    const result = await fetchAirportPhoto(airport.name, icao, airport.iata, airport.wikipediaLink)
    const now = new Date()

    await Airport.updateOne(
      { icao },
      {
        $set: {
          photoUrl: result.url,
          photoSource: result.source,
          photoStatus: result.status,
          photoUpdatedAt: now,
        },
      }
    )

    photoCache.set(icao, { url: result.url, source: result.source, status: result.status, ts: Date.now() })
    logger.info(`Airport photo ${icao}: ${result.url ? 'found' : 'not found'}`)

    res.setHeader('Cache-Control', 'public, max-age=21600') // 6h browser cache
    res.json({ url: result.url, source: result.source, status: result.status, updatedAt: now.toISOString() })
  } catch (err) {
    next(err)
  }
})

airportsRouter.delete('/:icao/photo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const icao = (req.params.icao as string).toUpperCase()
    const now = new Date()
    await Airport.updateOne(
      { icao },
      {
        $set: {
          photoUrl: null,
          photoSource: 'manual',
          photoStatus: 'rejected',
          photoUpdatedAt: now,
        },
      }
    )
    photoCache.delete(icao)
    res.json({ cleared: true })
  } catch (err) {
    next(err)
  }
})

airportsRouter.get('/:icao', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const airport = await Airport.findOne({ icao: (req.params.icao as string).toUpperCase() }).lean()
    if (!airport) {
      res.status(404).json({ error: 'Airport not found' })
      return
    }
    res.json(airport)
  } catch (err) {
    next(err)
  }
})
