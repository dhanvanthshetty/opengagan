// AirportDetail.tsx
// Full airport detail page — reached by clicking "View full details" in AirportPanel

import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { Airport } from '../types'
import { PageNav } from '../components/layout/PageNav'

export default function AirportDetail() {
  const { icao } = useParams<{ icao: string }>()

  const { data: airport, isLoading, error } = useQuery<Airport>({
    queryKey: ['airport', icao],
    queryFn: () =>
      api.get<Airport>(`/airports/${icao}`).then((r) => r.data),
    enabled: Boolean(icao),
  })

  const navyBg = 'radial-gradient(ellipse 120% 80% at 50% 50%, #2c4060 0%, #223356 30%, #182844 70%, #101e35 100%)'

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: navyBg, color: 'rgba(236,232,212,0.55)' }}
      >
        Loading airport data…
      </div>
    )
  }

  if (error || !airport) {
    return (
      <div className="min-h-screen" style={{ background: navyBg, color: '#ECE8D4' }}>
        <PageNav />
        <div className="p-8">
        <Link
          to="/dashboard"
          className="text-sm mb-6 inline-block"
          style={{ color: '#6b7838' }}
        >
          ← Back to Globe
        </Link>
        <div className="max-w-xl mx-auto text-center mt-20">
          <div className="mb-4" style={{ color: 'rgba(236,232,212,0.55)' }}>Airport not found: {icao}</div>
          <Link to="/dashboard" className="text-sm" style={{ color: '#6b7838' }}>
            Return to globe
          </Link>
        </div>
        </div>
      </div>
    )
  }

  const [lon, lat] = airport.location.coordinates

  return (
    <div className="min-h-screen" style={{ background: navyBg, color: '#ECE8D4' }}>
      <PageNav />

      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#ECE8D4' }}>{airport.name}</h1>
              <p className="mt-1" style={{ color: 'rgba(236,232,212,0.55)' }}>{airport.municipality}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {airport.iata && (
                  <span
                    className="rounded px-2.5 py-1 font-mono text-sm"
                    style={{
                      background: 'rgba(107,120,56,0.12)',
                      color: '#6b7838',
                      border: '1px solid rgba(107,120,56,0.25)',
                    }}
                  >
                    IATA: {airport.iata}
                  </span>
                )}
                <span
                  className="rounded px-2.5 py-1 font-mono text-sm"
                  style={{
                    background: 'rgba(26,37,64,0.07)',
                    color: '#2d3d5c',
                    border: '1px solid rgba(26,37,64,0.12)',
                  }}
                >
                  ICAO: {airport.icao}
                </span>
                {airport.udanServed && (
                  <span
                    className="rounded px-2.5 py-1 text-sm"
                    style={{
                      background: 'rgba(249,115,22,0.12)',
                      color: '#c2410c',
                      border: '1px solid rgba(249,115,22,0.25)',
                    }}
                  >
                    UDAN Route
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoCard label="Airport Type" value={airport.type?.replace(/_/g, ' ')} />
            <InfoCard label="Scheduled Service" value={airport.scheduledService ? 'Yes' : 'No'} />
            <InfoCard label="Elevation" value={airport.elevationFt ? `${airport.elevationFt} ft` : '—'} />
            <InfoCard label="Country" value={airport.country} />
            <InfoCard label="Latitude" value={`${lat.toFixed(4)}°N`} />
            <InfoCard label="Longitude" value={`${lon.toFixed(4)}°E`} />
          </div>

          <div className="flex gap-3">
            <Link
              to={`/carbon?origin=${airport.iata ?? airport.icao}`}
              className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              style={{ background: '#6b7838', color: '#ECE8D4' }}
            >
              Calculate CO₂ →
            </Link>
            <a
              href="https://airsewa.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: 'transparent',
                border: '1px solid rgba(236,232,212,0.30)',
                color: '#ECE8D4',
              }}
            >
              File Grievance ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(245,242,232,0.95)',
        border: '1px solid rgba(26,37,64,0.12)',
        boxShadow: '0 4px 16px rgba(26,37,64,0.10)',
      }}
    >
      <div className="text-xs mb-1" style={{ color: 'rgba(26,37,64,0.55)' }}>{label}</div>
      <div className="font-medium capitalize" style={{ color: '#1a2540' }}>{value ?? '—'}</div>
    </div>
  )
}
