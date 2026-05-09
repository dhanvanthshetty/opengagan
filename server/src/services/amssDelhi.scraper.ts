import axios from 'axios'
import * as cheerio from 'cheerio'
import { WeatherCache } from '../models/WeatherCache'
import { emitFogAlert } from '../socket/gateway'
import { logger } from '../utils/logger'
import { fetchWeatherForAirport } from './owm.service'

const AMSS_URL = 'https://amssdelhi.gov.in/fog/nitc15.php'
const VIDP_ICAO = 'VIDP'
const VIDP_LAT = 28.5665
const VIDP_LON = 77.1031
const FOG_RVR_THRESHOLD = 550

export async function scrapeAMSSDelhi(): Promise<void> {
  try {
    const res = await axios.get<string>(AMSS_URL, {
      timeout: 15_000,
      headers: {
        'User-Agent': 'OpenGagan/1.0 (https://github.com/opengagan; non-commercial research)',
      },
      responseType: 'text',
    })

    const $ = cheerio.load(res.data)
    const rvr: Record<string, number> = {}
    let wxCode = ''

    $('table tr').each((_i, row) => {
      const cells = $(row).find('td')
      if (cells.length >= 2) {
        const runway = $(cells[0]).text().trim()
        const rvrText = $(cells[1]).text().trim()
        const rvrVal = parseInt(rvrText.replace(/[^\d]/g, ''), 10)
        if (runway && !isNaN(rvrVal)) rvr[runway] = rvrVal
      }
    })

    const bodyText = $('body').text()
    if (bodyText.includes(' FG ') || bodyText.includes('FG\n')) wxCode = 'FG'
    else if (bodyText.includes(' BR ') || bodyText.includes('BR\n')) wxCode = 'BR'
    else if (bodyText.includes(' HZ ')) wxCode = 'HZ'

    await WeatherCache.findOneAndUpdate(
      { icao: VIDP_ICAO },
      {
        $set: {
          icao: VIDP_ICAO,
          rvr,
          wxCode,
          updatedAt: new Date(),
          source: 'amss',
        },
      },
      { upsert: true }
    )

    const lowestRVR = Object.values(rvr).length > 0 ? Math.min(...Object.values(rvr)) : Infinity

    if (lowestRVR < FOG_RVR_THRESHOLD) {
      logger.warn(`VIDP fog alert: lowest RVR ${lowestRVR}m`)
      emitFogAlert(VIDP_ICAO, lowestRVR)
    }

    logger.debug(`AMSS scrape complete: ${Object.keys(rvr).length} runways, wxCode=${wxCode}`)
  } catch (err) {
    logger.warn('AMSS scrape failed, falling back to OWM', { error: (err as Error).message })
    await fetchWeatherForAirport(VIDP_ICAO, VIDP_LAT, VIDP_LON)
  }
}
