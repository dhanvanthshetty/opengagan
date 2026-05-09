import { Suspense, lazy, useEffect } from 'react'
import { useAirports } from '../hooks/useAirports'
import { useLiveStates } from '../hooks/useLiveStates'
import { useGlobeStore } from '../store/globeStore'
import { StatusBar } from '../components/panels/StatusBar'
import { LayerControls } from '../components/panels/LayerControls'
import { AircraftPanel } from '../components/panels/AircraftPanel'
import { AirportDrawer } from '../components/panels/AirportDrawer'
import { FogOverlay } from '../components/globe/FogOverlay'
import { FIRMSLegend, useFIRMSData } from '../components/globe/FIRMSHotspots'
import { PageNav } from '../components/layout/PageNav'

const DeckGlobe = lazy(() =>
  import('../components/globe/DeckGlobe').then((m) => ({ default: m.DeckGlobe }))
)

export default function Dashboard() {
  const { data: airports, isLoading } = useAirports()
  const { states } = useLiveStates()
  const { selectedAircraft, activeLayers, setLiveStates } = useGlobeStore()
  const { data: firmsData } = useFIRMSData()

  useEffect(() => {
    setLiveStates(states)
  }, [states, setLiveStates])

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 50%, #2c4060 0%, #223356 30%, #182844 70%, #101e35 100%)' }}>

      {/* ── Globe canvas (full screen) ───────────────────────────────── */}
      <Suspense fallback={null}>
        {!isLoading && airports && (
          <DeckGlobe airports={airports} states={states} firmsData={firmsData} />
        )}
      </Suspense>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
          Loading airports…
        </div>
      )}

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <PageNav />

      {/* Fog alert banner */}
      {activeLayers.has('fog') && <FogOverlay />}

      {/* FIRMS legend */}
      {activeLayers.has('firms') && (
        <FIRMSLegend count={firmsData?.length ?? 0} />
      )}

      {/* Side panels */}
      {selectedAircraft && <AircraftPanel />}
      <AirportDrawer />
      <LayerControls />
      <StatusBar airportsCount={airports?.length ?? 0} liveCount={states.length} />
    </div>
  )
}
