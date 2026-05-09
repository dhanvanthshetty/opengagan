// useCarbon.ts
// Fetches carbon calculation from backend

import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { CarbonResult } from '../types'

export function useCarbon(origin: string, dest: string, pax = 1) {
  return useQuery<CarbonResult>({
    queryKey: ['carbon', origin, dest, pax],
    queryFn: () =>
      api
        .get<CarbonResult>('/carbon', { params: { origin, dest, pax } })
        .then((r) => r.data),
    enabled: origin.length === 3 && dest.length === 3 && origin !== dest,
    staleTime: 24 * 60 * 60 * 1000,  // 24hr — distance never changes
  })
}
