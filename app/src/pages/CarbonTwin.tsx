import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { CarbonResult } from '../types'
import { useGlobeStore } from '../store/globeStore'
import { useAirports } from '../hooks/useAirports'
import { PageNav } from '../components/layout/PageNav'

export default function CarbonTwin() {
  const [origin, setOrigin] = useState('BLR')
  const [dest, setDest] = useState('DEL')
  const [pax, setPax] = useState(1)
  const [query, setQuery] = useState({ origin: 'BLR', dest: 'DEL', pax: 1 })
  const { setCarbonRoute, toggleLayer, activeLayers } = useGlobeStore()
  const { data: airports } = useAirports()

  const { data, isLoading } = useQuery({
    queryKey: ['carbon', query.origin, query.dest, query.pax],
    queryFn: async () => {
      const res = await api.get<CarbonResult>('/carbon', { params: query })
      // Wire the carbon route into globeStore so the globe can show the plume
      const originAirport = airports?.find((a) => a.iata === query.origin)
      const destAirport = airports?.find((a) => a.iata === query.dest)
      if (originAirport && destAirport) {
        setCarbonRoute({
          originIata: query.origin,
          destIata: query.dest,
          originLat: originAirport.location.coordinates[1],
          originLon: originAirport.location.coordinates[0],
          destLat: destAirport.location.coordinates[1],
          destLon: destAirport.location.coordinates[0],
          co2Kg: res.data.co2Kg,
        })
        // Auto-activate carbon layer on globe
        if (!activeLayers.has('carbon')) toggleLayer('carbon')
      }
      return res.data
    },
  })

  return (
    <div className="relative min-h-screen" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 50%, #2c4060 0%, #223356 30%, #182844 70%, #101e35 100%)', color: '#ECE8D4' }}>
      <PageNav />

      <div className="max-w-xl mx-auto px-6 pt-24 pb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#ECE8D4' }}>Carbon Twin</h1>
        <p className="mb-8 text-sm" style={{ color: 'rgba(236,232,212,0.60)' }}>
          Calculate CO₂ emissions for any India flight route using ICCT methodology (90g CO₂/RPK).
        </p>

        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(236,232,212,0.93)',
            border: '1px solid rgba(26,37,64,0.14)',
            boxShadow: '0 8px 32px rgba(26,37,64,0.18)',
          }}
        >
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#2d3d5c' }}>Origin IATA</label>
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                className="w-full rounded-lg px-3 py-2 font-mono text-sm"
                style={{
                  background: 'rgba(26,37,64,0.07)',
                  border: '1px solid rgba(26,37,64,0.18)',
                  color: '#1a2540',
                }}
                maxLength={3}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#2d3d5c' }}>Destination IATA</label>
              <input
                value={dest}
                onChange={(e) => setDest(e.target.value.toUpperCase())}
                className="w-full rounded-lg px-3 py-2 font-mono text-sm"
                style={{
                  background: 'rgba(26,37,64,0.07)',
                  border: '1px solid rgba(26,37,64,0.18)',
                  color: '#1a2540',
                }}
                maxLength={3}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#2d3d5c' }}>Passengers</label>
              <input
                type="number"
                value={pax}
                onChange={(e) => setPax(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={500}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  background: 'rgba(26,37,64,0.07)',
                  border: '1px solid rgba(26,37,64,0.18)',
                  color: '#1a2540',
                }}
              />
            </div>
          </div>

          <button
            onClick={() => setQuery({ origin, dest, pax })}
            className="w-full rounded-lg px-4 py-2 font-medium transition-colors text-white"
            style={{ background: '#6b7838' }}
          >
            Calculate
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-8" style={{ color: 'rgba(236,232,212,0.55)' }}>Calculating…</div>
        )}

        {data && (
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: 'rgba(236,232,212,0.93)',
              border: '1px solid rgba(26,37,64,0.14)',
              boxShadow: '0 8px 32px rgba(26,37,64,0.18)',
            }}
          >
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-500">{data.co2Kg} kg</div>
              <div className="text-sm mt-1" style={{ color: '#2d3d5c' }}>CO₂ for {data.origin} → {data.destination}</div>
            </div>
            <div
              className="grid grid-cols-2 gap-3 pt-4"
              style={{ borderTop: '1px solid rgba(26,37,64,0.12)' }}
            >
              <Stat label="Per passenger" value={`${data.co2PerPax} kg`} />
              <Stat label="Distance" value={`${data.distanceKm} km`} />
              <Stat label="Trees needed" value={`${data.treesNeeded} tree-years`} />
              <Stat label="= Driving equivalent" value={`${data.drivingEquivalentKm} km`} />
            </div>
            <p className="text-xs text-center pt-2" style={{ color: '#6b7838' }}>
              Source: ICCT 2018 (90g CO₂/RPK) · +8% indirect routing uplift
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'rgba(26,37,64,0.06)',
        border: '1px solid rgba(26,37,64,0.10)',
      }}
    >
      <div className="text-xs mb-0.5" style={{ color: '#6b7838' }}>{label}</div>
      <div className="font-semibold" style={{ color: '#1a2540' }}>{value}</div>
    </div>
  )
}
