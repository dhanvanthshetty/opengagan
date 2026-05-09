import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { Airport } from '../../../shared/src/index'

const INDIA_BBOX = '6.5,68,37,97.5'

async function fetchAllAirports(): Promise<Airport[]> {
  const all: Airport[] = []
  let page = 1
  const limit = 200

  while (true) {
    const res = await api.get<Airport[]>('/airports', {
      params: { bbox: INDIA_BBOX, limit, page },
    })
    all.push(...res.data)
    const total = parseInt(res.headers['x-total-count'] ?? '0', 10)
    if (all.length >= total || res.data.length < limit) break
    page++
  }

  return all
}

export function useAirports() {
  return useQuery({
    queryKey: ['airports'],
    queryFn: fetchAllAirports,
    staleTime: 60 * 60 * 1000,
  })
}
