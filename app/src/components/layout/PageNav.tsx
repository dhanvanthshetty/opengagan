import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/carbon', label: 'Carbon Twin' },
  { to: '/rights', label: 'My Rights' },
  { to: '/student-pilot', label: 'Student Pilot' },
]

export function PageNav() {
  const location = useLocation()

  return (
    <nav className="absolute top-3 left-0 right-0 z-30 flex items-center justify-between px-5">

      {/* Logo pill — same shape as center nav */}
      <Link
        to="/"
        className="flex items-center gap-2 rounded-full px-2 py-1.5"
        style={{
          background: 'rgba(236,232,212,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(26,37,64,0.15)',
          boxShadow: '0 4px 24px rgba(10,16,32,0.35)',
        }}
      >
        <img
          src="/assets/logo-icon.png"
          alt="OpenGagan"
          className="object-contain rounded-full"
          style={{ height: 32, width: 32 }}
        />
        <span className="text-sm font-semibold tracking-tight pr-2" style={{ color: '#1a2540' }}>
          Open<span style={{ color: '#6b7838' }}>Gagan</span>
        </span>
      </Link>

      {/* Centered pill nav */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-2 py-1.5"
        style={{
          background: 'rgba(236,232,212,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(26,37,64,0.15)',
          boxShadow: '0 4px 24px rgba(10,16,32,0.35)',
        }}
      >
        {NAV_LINKS.map(({ to, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={active ? {
                background: '#1a2540',
                color: '#ECE8D4',
                boxShadow: '0 2px 14px rgba(26,37,64,0.45)',
              } : {
                color: 'rgba(26,37,64,0.60)',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Right spacer */}
      <span className="w-32" />
    </nav>
  )
}
