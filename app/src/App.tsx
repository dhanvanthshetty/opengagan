import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const AirportDetail = lazy(() => import('./pages/AirportDetail'))
const CarbonTwin = lazy(() => import('./pages/CarbonTwin'))
const RightsWorkflow = lazy(() => import('./pages/RightsWorkflow'))
const StudentPilot = lazy(() => import('./pages/StudentPilot'))

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-sky-dark text-slate-300">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm">Loading OpenGagan…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/airport/:icao" element={<AirportDetail />} />
        <Route path="/carbon" element={<CarbonTwin />} />
        <Route path="/rights" element={<RightsWorkflow />} />
        <Route path="/student-pilot" element={<StudentPilot />} />
      </Routes>
    </Suspense>
  )
}
