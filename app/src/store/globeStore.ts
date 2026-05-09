import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AircraftState, Airport } from '../../../shared/src/index'

type LayerName = 'aircraft' | 'udan' | 'carbon' | 'fog' | 'firms'

export interface CarbonRoute {
  originIata: string
  destIata: string
  originLat: number
  originLon: number
  destLat: number
  destLon: number
  co2Kg: number
}

interface GlobeStore {
  activeLayers: Set<LayerName>
  selectedAircraft: AircraftState | null
  selectedAirport: Airport | null
  cameraPos: { lat: number; lng: number; altitude: number }
  carbonRoute: CarbonRoute | null
  liveStates: AircraftState[]
  toggleLayer: (layer: LayerName) => void
  selectAircraft: (a: AircraftState | null) => void
  selectAirport: (a: Airport | null) => void
  setCameraPos: (pos: { lat: number; lng: number; altitude: number }) => void
  setCarbonRoute: (route: CarbonRoute | null) => void
  setLiveStates: (states: AircraftState[]) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setAwareStorage = createJSONStorage<any>(() => localStorage, {
  replacer: (_key, value) => {
    if (value instanceof Set) return { __type: 'Set', values: [...value] }
    return value
  },
  reviver: (_key, value) => {
    if (value && typeof value === 'object' && (value as { __type?: string }).__type === 'Set') {
      return new Set((value as { values: LayerName[] }).values)
    }
    return value
  },
})

export const useGlobeStore = create<GlobeStore>()(
  persist(
    (set) => ({
      activeLayers: new Set<LayerName>(['aircraft', 'udan']),
      selectedAircraft: null,
      selectedAirport: null,
      cameraPos: { lat: 20.5, lng: 78.9, altitude: 1.8 },
      carbonRoute: null,
      liveStates: [],

      toggleLayer: (layer) =>
        set((state) => {
          const next = new Set(state.activeLayers)
          if (next.has(layer)) next.delete(layer)
          else next.add(layer)
          return { activeLayers: next }
        }),

      selectAircraft: (a) => set({ selectedAircraft: a, selectedAirport: null }),
      selectAirport: (a) => set({ selectedAirport: a, selectedAircraft: null }),
      setCameraPos: (pos) => set({ cameraPos: pos }),
      setCarbonRoute: (route) => set({ carbonRoute: route }),
      setLiveStates: (states) => set({ liveStates: states }),
    }),
    {
      name: 'opengagan-globe',
      storage: setAwareStorage,
      partialize: (state) => ({ activeLayers: state.activeLayers }),
    }
  )
)
