import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Airport } from '../types'
import api from '../lib/api'

export interface AirportImageResult {
  icao: string
  url: string | null
  source?: string | null
  status?: string | null
  updatedAt?: string | null
}

export function useAirportImage(airport: Airport | null) {
  const queryClient = useQueryClient()

  const query = useQuery<AirportImageResult | null>({
    queryKey: ['airport-photo', airport?.icao],
    queryFn: async () => {
      const res = await api.get<{ url: string | null; source?: string | null; status?: string | null; updatedAt?: string | null }>(
        `/airports/${airport!.icao}/photo`
      )
      return {
        icao: airport!.icao,
        url: res.data.url,
        source: res.data.source ?? null,
        status: res.data.status ?? null,
        updatedAt: res.data.updatedAt ?? null,
      }
    },
    enabled: Boolean(airport),
    staleTime: 6 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: null,
    retry: 1,
  })

  const refresh = async () => {
    if (!airport) return
    queryClient.removeQueries({ queryKey: ['airport-photo', airport.icao] })
    const res = await api.get<{ url: string | null; source?: string | null; status?: string | null; updatedAt?: string | null }>(
      `/airports/${airport.icao}/photo?refresh=true`
    )
    const result: AirportImageResult = {
      icao: airport.icao,
      url: res.data.url,
      source: res.data.source ?? null,
      status: res.data.status ?? null,
      updatedAt: res.data.updatedAt ?? null,
    }
    queryClient.setQueryData(['airport-photo', airport.icao], result)
    return result
  }

  return { ...query, refresh }
}
