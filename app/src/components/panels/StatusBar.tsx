interface Props {
  airportsCount: number
  liveCount: number
}

export function StatusBar({ airportsCount, liveCount }: Props) {
  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 backdrop-blur-sm rounded-full px-5 py-2 text-xs"
      style={{
        background: 'rgba(236,232,212,0.93)',
        border: '1px solid rgba(26,37,64,0.14)',
        boxShadow: '0 4px 16px rgba(26,37,64,0.12)',
        color: '#1a2540',
      }}
    >
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>{liveCount} live aircraft</span>
      </span>
      <span style={{ color: 'rgba(26,37,64,0.2)' }}>|</span>
      <span>{airportsCount} airports</span>
      <span style={{ color: 'rgba(26,37,64,0.2)' }}>|</span>
      <span style={{ color: 'rgba(26,37,64,0.45)' }}>Data: OpenSky · OurAirports · NASA FIRMS</span>
    </div>
  )
}
