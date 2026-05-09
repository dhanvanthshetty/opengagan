// useRoutes.ts
// Fetches route arc data from the backend for display on the globe

import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { RouteArc } from '../components/globe/RouteArcs'

interface BackendRoute {
  _id: string
  originIata: string
  destIata: string
  originLat: number
  originLon: number
  destLat: number
  destLon: number
  passengers: number
  isUdan: boolean
}

export function useRoutes() {
  return useQuery<RouteArc[]>({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data } = await api.get<BackendRoute[]>('/routes')
      return data.map((r) => ({
        originLat: r.originLat,
        originLon: r.originLon,
        destLat: r.destLat,
        destLon: r.destLon,
        passengers: r.passengers ?? 10000,
        isUdan: r.isUdan ?? false,
        originIata: r.originIata,
        destIata: r.destIata,
      }))
    },
    staleTime: 0,               // always fresh — derived routes change with DB
    gcTime: 2 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
  })
}
