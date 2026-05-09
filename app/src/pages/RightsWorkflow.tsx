import React, { useState, useMemo } from 'react'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import type { RightsSituation } from '../types'
import { DGCA } from '../../../shared/src/constants/dgca'
import { generateGrievancePDF } from '../lib/pdf'
import { RIGHTS_NODES, RIGHTS_EDGES, getActivePath } from '../components/flow/rightsTree'
import { rightsNodeTypes } from '../components/flow/RightsNodes'
import { rightsEdgeTypes } from '../components/flow/RightsEdges'
import { PageNav } from '../components/layout/PageNav'

// Pure client-side DGCA entitlement evaluator
function evaluateRights(delayMinutes: number, situation: RightsSituation) {
  const out: Array<{ id: string; label: string; amount?: number; rule?: string }> = []

  if (situation === 'delay') {
    if (delayMinutes >= DGCA.DELAY_MEALS_MINUTES)
      out.push({ id: 'meals', label: 'Free meals & refreshments', rule: 'CAR S3 M4 §3.3.1' })
    if (delayMinutes >= DGCA.DELAY_COMP_5K_MINUTES)
      out.push({ id: 'comp5k', label: 'Compensation ₹5,000', amount: 5000, rule: 'CAR S3 M4 §3.3.2' })
    if (delayMinutes >= DGCA.DELAY_ALT_FLIGHT_MINUTES) {
      out.push({ id: 'altflight', label: 'Alternate flight or full refund', rule: 'CAR S3 M4 §3.3.3' })
      out.push({ id: 'comp10k', label: 'Compensation ₹10,000', amount: 10000, rule: 'CAR S3 M4 §3.3.3' })
    }
    if (delayMinutes >= DGCA.DELAY_HOTEL_HOURS * 60)
      out.push({ id: 'hotel', label: 'Hotel accommodation + transfers', rule: 'CAR S3 M4 §3.3.4' })
  }
  if (situation === 'denied_boarding') {
    out.push({ id: 'denied', label: '400% basic fare or ₹20,000 (whichever lower)', amount: DGCA.DENIED_BOARDING_COMP, rule: 'CAR S3 M4 §4.1' })
    out.push({ id: 'meals_db', label: 'Free meals & refreshments', rule: 'CAR S3 M4 §4.2' })
  }
  if (situation === 'cancel') {
    out.push({ id: 'freecancel', label: 'Full refund within 48 hours of booking', rule: 'DGCA Circular Mar 2026' })
    out.push({ id: 'altflight_c', label: 'Alternate flight at no extra cost', rule: 'CAR S3 M4 §5.1' })
  }

  return out
}

// Lay out nodes in a simple top-down grid using x/y offsets
function layoutNodes(situation: string, activePath: Set<string>) {
  // Column assignments per branch
  const columns: Record<string, number> = {
    'start': 1, 'q-type': 1,
    'q-delay-2h': 0, 'e-meals': -1, 'q-delay-3h': 0, 'e-comp5k': -1,
    'q-delay-6h': 0, 'e-altflight': -1.5, 'e-comp10k': -0.5, 'q-delay-24h': 0, 'e-hotel': -1,
    'q-denied': 1.5, 'e-denied': 1.5,
    'q-cancel': 3, 'q-cancel-48h': 3, 'e-freecancel': 3,
    'action': 1,
  }
  const rows: Record<string, number> = {
    'start': 0, 'q-type': 1,
    'q-delay-2h': 2, 'e-meals': 3,
    'q-delay-3h': 3, 'e-comp5k': 4,
    'q-delay-6h': 4, 'e-altflight': 5, 'e-comp10k': 5,
    'q-delay-24h': 5, 'e-hotel': 6,
    'q-denied': 2, 'e-denied': 3,
    'q-cancel': 2, 'q-cancel-48h': 3, 'e-freecancel': 4,
    'action': 7,
  }

  return RIGHTS_NODES.map(n => ({
    ...n,
    position: { x: (columns[n.id] ?? 0) * 220 + 300, y: (rows[n.id] ?? 0) * 110 },
    data: { ...n.data, active: activePath.has(n.id) },
  }))
}

export default function RightsWorkflow() {
  const [situation, setSituation] = useState<RightsSituation>('delay')
  const [delayMinutes, setDelayMinutes] = useState(180)
  const [flightNumber, setFlightNumber] = useState('')

  const activePath = useMemo(() => getActivePath(situation, delayMinutes), [situation, delayMinutes])
  const entitlements = useMemo(() => evaluateRights(delayMinutes, situation), [delayMinutes, situation])

  const nodes = useMemo(() => layoutNodes(situation, activePath), [situation, activePath])
  const edges = useMemo(() =>
    RIGHTS_EDGES.map(e => ({
      ...e,
      type: 'default',
      data: { active: activePath.has(e.source) && activePath.has(e.target) },
    })),
    [activePath]
  )

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 50%, #2c4060 0%, #223356 30%, #182844 70%, #101e35 100%)', color: '#ECE8D4' }}>
      <PageNav />

      {/* Spacer for absolute navbar */}
      <div className="h-20 flex-shrink-0" />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — inputs */}
        <div
          className="w-72 flex-shrink-0 p-5 space-y-5 overflow-y-auto"
          style={{
            background: 'rgba(236,232,212,0.93)',
            borderRight: '1px solid rgba(26,37,64,0.20)',
            color: '#1a2540',
          }}
        >
          <div>
            <label className="text-xs block mb-1.5" style={{ color: '#2d3d5c' }}>Flight number (optional)</label>
            <input
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              placeholder="6E501"
              className="rounded-lg px-3 py-2 font-mono text-sm w-full"
              style={{
                background: 'rgba(255,253,246,0.9)',
                border: '1px solid rgba(26,37,64,0.2)',
                color: '#1a2540',
              }}
            />
          </div>

          <div>
            <label className="text-xs block mb-1.5" style={{ color: '#2d3d5c' }}>What happened?</label>
            <div className="flex flex-col gap-2">
              {(['delay', 'cancel', 'denied_boarding'] as RightsSituation[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSituation(s)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors"
                  style={
                    situation === s
                      ? { background: '#1a2540', color: '#ECE8D4' }
                      : { background: 'rgba(26,37,64,0.07)', color: '#1a2540', border: '1px solid rgba(26,37,64,0.12)' }
                  }
                >
                  {s === 'delay' ? 'Delay' : s === 'cancel' ? 'Cancellation' : 'Denied Boarding'}
                </button>
              ))}
            </div>
          </div>

          {situation === 'delay' && (
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#2d3d5c' }}>
                Delay: <span style={{ color: '#1a2540', fontWeight: 600 }}>{Math.floor(delayMinutes / 60)}h {delayMinutes % 60}m</span>
              </label>
              <input
                type="range" min={30} max={1440} step={30}
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: '#6b7838' }}
              />
            </div>
          )}

          {/* Entitlements summary */}
          {entitlements.length > 0 && (
            <div className="space-y-2">
              <div
                className="text-xs uppercase tracking-wide font-semibold"
                style={{ color: 'rgba(26,37,64,0.55)' }}
              >
                Your entitlements
              </div>
              {entitlements.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg p-3"
                  style={{
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.25)',
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: '#15803d' }}>{e.label}</div>
                  {e.amount && (
                    <div className="text-xs font-mono" style={{ color: '#16a34a' }}>
                      ₹{e.amount.toLocaleString('en-IN')}
                    </div>
                  )}
                  {e.rule && (
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(26,37,64,0.45)' }}>{e.rule}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => generateGrievancePDF(flightNumber || 'Unknown', entitlements)}
              disabled={entitlements.length === 0}
              className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#1a2540', color: '#ECE8D4' }}
            >
              Export PDF →
            </button>
            <a
              href="https://airsewa.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-center transition-colors"
              style={{ background: '#6b7838', color: '#ECE8D4' }}
            >
              File on AirSewa ↗
            </a>
          </div>
        </div>

        {/* Right panel — React Flow decision tree */}
        <div className="flex-1 relative" style={{ background: 'rgba(236,232,212,0.6)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={rightsNodeTypes}
            edgeTypes={rightsEdgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnScroll
            zoomOnScroll
          >
            <Background color="rgba(26,37,64,0.08)" gap={24} />
            <Controls
              showInteractive={false}
              style={{
                background: 'rgba(236,232,212,0.93)',
                border: '1px solid rgba(26,37,64,0.14)',
              }}
            />
            <MiniMap
              nodeColor={(n) => (n.data?.active ? '#1a2540' : 'rgba(26,37,64,0.15)')}
              maskColor="rgba(236,232,212,0.7)"
              style={{
                background: 'rgba(236,232,212,0.93)',
                border: '1px solid rgba(26,37,64,0.14)',
              }}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
