import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface FogPoint {
  icao: string
  latitude: number
  longitude: number
  visibility?: number
  wxCode?: string
  rvrMin?: number
  updatedAt?: string
}

const INDIA_BBOX = '6.5,68,37,97.5'

export function useFogData(enabled = true) {
  return useQuery<FogPoint[]>({
    queryKey: ['fog'],
    queryFn: async () => {
      const res = await api.get<FogPoint[]>('/weather/fog', {
        params: { bbox: INDIA_BBOX },
      })
      return res.data
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchInterval: enabled ? 10 * 60 * 1000 : false,
    retry: 1,
  })
}
