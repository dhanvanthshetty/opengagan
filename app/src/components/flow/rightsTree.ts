// DGCA CAR Section 3 Series M Part IV — passenger rights decision tree
// Pure data — no imports, no framework code
import type { Node, Edge } from 'reactflow'
import type { RightsNodeType } from '../../types'

export interface RightsNodeData {
  label: string
  rule?: string
  amount?: number
  active?: boolean
}

export type RightsFlowNode = Node<RightsNodeData, RightsNodeType>
export type RightsFlowEdge = Edge<{ active?: boolean }>

export const RIGHTS_NODES: RightsFlowNode[] = [
  { id: 'start',        type: 'start',       data: { label: 'Your Flight ✈' },            position: { x: 0, y: 0 } },
  { id: 'q-type',       type: 'check',       data: { label: 'What happened?' },             position: { x: 0, y: 0 } },
  { id: 'q-delay-2h',   type: 'check',       data: { label: 'Delay ≥ 2 hours?' },           position: { x: 0, y: 0 } },
  { id: 'e-meals',      type: 'entitlement', data: { label: 'Free meals & refreshments', rule: 'CAR S3 M4 §3.3.1' }, position: { x: 0, y: 0 } },
  { id: 'q-delay-3h',   type: 'check',       data: { label: 'Delay ≥ 3 hours?' },           position: { x: 0, y: 0 } },
  { id: 'e-comp5k',     type: 'entitlement', data: { label: 'Compensation ₹5,000', rule: 'CAR S3 M4 §3.3.2', amount: 5000 }, position: { x: 0, y: 0 } },
  { id: 'q-delay-6h',   type: 'check',       data: { label: 'Delay ≥ 6 hours?' },           position: { x: 0, y: 0 } },
  { id: 'e-altflight',  type: 'entitlement', data: { label: 'Alternate flight or full refund', rule: 'CAR S3 M4 §3.3.3' }, position: { x: 0, y: 0 } },
  { id: 'e-comp10k',    type: 'entitlement', data: { label: 'Compensation ₹10,000', rule: 'CAR S3 M4 §3.3.3', amount: 10000 }, position: { x: 0, y: 0 } },
  { id: 'q-delay-24h',  type: 'check',       data: { label: 'Delay ≥ 24 hours?' },          position: { x: 0, y: 0 } },
  { id: 'e-hotel',      type: 'entitlement', data: { label: 'Hotel + transfers', rule: 'CAR S3 M4 §3.3.4' }, position: { x: 0, y: 0 } },
  { id: 'q-denied',     type: 'check',       data: { label: 'Denied boarding?' },            position: { x: 0, y: 0 } },
  { id: 'e-denied',     type: 'entitlement', data: { label: '400% basic fare or ₹20,000', rule: 'CAR S3 M4 §4.1', amount: 20000 }, position: { x: 0, y: 0 } },
  { id: 'q-cancel',     type: 'check',       data: { label: 'Flight cancelled?' },           position: { x: 0, y: 0 } },
  { id: 'q-cancel-48h', type: 'check',       data: { label: 'Notice ≥ 48 hours ahead?' },   position: { x: 0, y: 0 } },
  { id: 'e-freecancel', type: 'entitlement', data: { label: 'Free cancellation', rule: 'DGCA Circular Mar 2026' }, position: { x: 0, y: 0 } },
  { id: 'action',       type: 'action',      data: { label: 'Export PDF → File on AirSewa ↗' }, position: { x: 0, y: 0 } },
]

export const RIGHTS_EDGES: RightsFlowEdge[] = [
  { id: 'e1',  source: 'start',        target: 'q-type',       label: '' },
  { id: 'e2',  source: 'q-type',       target: 'q-delay-2h',   label: 'Delay' },
  { id: 'e3',  source: 'q-type',       target: 'q-denied',     label: 'Denied boarding' },
  { id: 'e4',  source: 'q-type',       target: 'q-cancel',     label: 'Cancelled' },
  { id: 'e5',  source: 'q-delay-2h',   target: 'e-meals',      label: 'Yes' },
  { id: 'e6',  source: 'q-delay-2h',   target: 'q-delay-3h',   label: 'Also...' },
  { id: 'e7',  source: 'q-delay-3h',   target: 'e-comp5k',     label: 'Yes' },
  { id: 'e8',  source: 'q-delay-3h',   target: 'q-delay-6h',   label: 'Also...' },
  { id: 'e9',  source: 'q-delay-6h',   target: 'e-altflight',  label: 'Yes' },
  { id: 'e10', source: 'q-delay-6h',   target: 'e-comp10k',    label: '' },
  { id: 'e11', source: 'q-delay-6h',   target: 'q-delay-24h',  label: 'Also...' },
  { id: 'e12', source: 'q-delay-24h',  target: 'e-hotel',      label: 'Yes' },
  { id: 'e13', source: 'q-denied',     target: 'e-denied',     label: 'Yes' },
  { id: 'e14', source: 'q-cancel',     target: 'q-cancel-48h', label: '' },
  { id: 'e15', source: 'q-cancel-48h', target: 'e-freecancel', label: 'Yes' },
  { id: 'e16', source: 'e-meals',      target: 'action',       label: '' },
  { id: 'e17', source: 'e-denied',     target: 'action',       label: '' },
  { id: 'e18', source: 'e-freecancel', target: 'action',       label: '' },
  { id: 'e19', source: 'e-hotel',      target: 'action',       label: '' },
]

// IDs of nodes in the delay path for highlighting
export function getActivePath(situation: string, delayMinutes: number): Set<string> {
  const active = new Set<string>(['start', 'q-type', 'action'])
  if (situation === 'delay') {
    active.add('q-delay-2h')
    if (delayMinutes >= 120) active.add('e-meals')
    if (delayMinutes >= 180) { active.add('q-delay-3h'); active.add('e-comp5k') }
    if (delayMinutes >= 360) { active.add('q-delay-6h'); active.add('e-altflight'); active.add('e-comp10k') }
    if (delayMinutes >= 1440) { active.add('q-delay-24h'); active.add('e-hotel') }
  }
  if (situation === 'denied_boarding') {
    active.add('q-denied'); active.add('e-denied')
  }
  if (situation === 'cancel') {
    active.add('q-cancel'); active.add('q-cancel-48h'); active.add('e-freecancel')
  }
  return active
}
