import axios from 'axios'
import axiosRetry from 'axios-retry'
import { env } from '../config/env'
import { logger } from '../utils/logger'
import { INDIA_BOX } from '../utils/bbox'
import type { StateVector } from '../../../shared/src/index'

interface TokenResponse {
  access_token: string
  expires_in: number
}

interface OpenSkyResponse {
  time: number
  states: (string | number | boolean | null)[][] | null
}

interface BBox {
  lamin: number
  lomin: number
  lamax: number
  lomax: number
}

const client = axios.create({ timeout: 15_000 })
axiosRetry(client, { retries: 2, retryDelay: axiosRetry.exponentialDelay })

class OpenSkyService {
  private token = ''
  private expiresAt = 0
  private creditUsed = 0
  private lastTokenErrorAt = 0
  private tokenDisabledUntil = 0

  async getToken(): Promise<string> {
    const now = Date.now()

    if (now < this.tokenDisabledUntil) {
      return ''
    }

    if (this.token && now < this.expiresAt - 60_000) {
      return this.token
    }

    if (!env.OPENSKY_CLIENT_ID || !env.OPENSKY_CLIENT_SECRET) {
      return ''  // anonymous mode — lower rate limits
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.OPENSKY_CLIENT_ID,
      client_secret: env.OPENSKY_CLIENT_SECRET,
    })

    try {
      const res = await client.post<TokenResponse>(env.OPENSKY_TOKEN_URL, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      this.token = res.data.access_token
      this.expiresAt = Date.now() + res.data.expires_in * 1000
      logger.debug('OpenSky token refreshed')
      return this.token
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 401 || status === 403) {
        this.tokenDisabledUntil = now + 10 * 60_000
      }

      if (now - this.lastTokenErrorAt > 60_000) {
        this.lastTokenErrorAt = now
        logger.warn('OpenSky token request failed, using anonymous access', {
          status: status ?? 'network',
          error: (err as Error).message,
        })
      }
      this.token = ''
      this.expiresAt = 0
      return ''
    }
  }

  async getStates(bbox: BBox = INDIA_BOX): Promise<StateVector[]> {
    const token = await this.getToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await client.get<OpenSkyResponse>(
      'https://opensky-network.org/api/states/all',
      {
        params: {
          lamin: bbox.lamin,
          lomin: bbox.lomin,
          lamax: bbox.lamax,
          lomax: bbox.lomax,
        },
        headers,
      }
    )

    this.creditUsed += 1

    if (!res.data.states) return []

    return res.data.states.map((s) => ({
      icao24: s[0] as string,
      callsign: s[1] as string | null,
      originCountry: s[2] as string,
      timePosition: s[3] as number | null,
      lastContact: s[4] as number,
      longitude: s[5] as number | null,
      latitude: s[6] as number | null,
      baroAltitude: s[7] as number | null,
      onGround: s[8] as boolean,
      velocity: s[9] as number | null,
      trueTrack: s[10] as number | null,
      verticalRate: s[11] as number | null,
      sensors: s[12] as number[] | null,
      geoAltitude: s[13] as number | null,
      squawk: s[14] as string | null,
      spi: s[15] as boolean,
      positionSource: s[16] as number,
    }))
  }

  getCreditUsed() {
    return this.creditUsed
  }
}

export const openSkyService = new OpenSkyService()
