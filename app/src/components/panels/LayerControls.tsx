import { useGlobeStore } from '../../store/globeStore'
import layersData from '../../../../shared/src/data/layers.json'

const LAYERS = layersData as Array<{
  id: string
  label: string
  desc: string
  indicator: string
  pingColor?: string
  dotColor?: string
}>

// Animated dot+ring indicator — mirrors the globe radar effect
function RadarDot({
  active,
  pingColor,
  dotColor,
}: {
  active: boolean
  pingColor: string
  dotColor: string
}) {
  return (
    <span className="relative flex h-3 w-3 flex-shrink-0">
      {active && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${active ? dotColor : 'bg-slate-600'}`}
      />
    </span>
  )
}

// Arc indicator (two gradient bars)
function ArcDot({ active, yellow }: { active: boolean; yellow?: boolean }) {
  if (!active)
    return <span className="w-3 h-3 rounded-full bg-slate-600 flex-shrink-0" />
  return (
    <span className="flex-shrink-0 w-5 h-3 relative">
      <span
        className={`absolute inset-0 rounded-full ${yellow ? 'bg-gradient-to-r from-yellow-400 to-red-400' : 'bg-gradient-to-r from-orange-500 to-blue-400'}`}
        style={{ clipPath: 'ellipse(50% 30% at 50% 50%)' }}
      />
    </span>
  )
}

// Tiny plane icon
function PlaneDot({ active }: { active: boolean }) {
  return (
    <span
      className={`flex-shrink-0 text-[11px] leading-none ${active ? 'text-blue-400' : 'text-slate-600'}`}
    >
      ✈
    </span>
  )
}

export function LayerControls() {
  const { activeLayers, toggleLayer } = useGlobeStore()

  return (
    <div
      className="absolute bottom-16 left-4 z-10 w-56 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(236,232,212,0.93)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        border: '1px solid rgba(26,37,64,0.14)',
        boxShadow: '0 8px 32px rgba(26,37,64,0.18)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid rgba(26,37,64,0.12)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6b7838' }}>
          Map Layers
        </p>
      </div>

      <div className="p-2 space-y-0.5">
        {LAYERS.map((layer) => {
          const active = activeLayers.has(layer.id)
          return (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150"
              style={active ? {
                background: 'rgba(26,37,64,0.10)',
                color: '#1a2540',
              } : {
                color: 'rgba(26,37,64,0.45)',
              }}
            >
              {/* Indicator */}
              <span className="flex items-center justify-center w-5">
                {layer.indicator === 'radar' ? (
                  <RadarDot
                    active={active}
                    pingColor={(layer as { pingColor: string }).pingColor}
                    dotColor={(layer as { dotColor: string }).dotColor}
                  />
                ) : layer.indicator === 'aircraft' ? (
                  <PlaneDot active={active} />
                ) : layer.indicator === 'arc-yellow' ? (
                  <ArcDot active={active} yellow />
                ) : (
                  <ArcDot active={active} />
                )}
              </span>

              {/* Text */}
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium leading-snug truncate">
                  {layer.label}
                </span>
                <span
                  className="text-[10px] leading-tight truncate"
                  style={{ color: active ? '#6b7838' : 'rgba(26,37,64,0.35)' }}
                >
                  {layer.desc}
                </span>
              </span>

              {/* Active pill */}
              <span
                className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full transition-all"
                style={active ? {
                  background: '#6b7838',
                  boxShadow: '0 0 6px 2px rgba(107,120,56,0.45)',
                } : { background: 'transparent' }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
