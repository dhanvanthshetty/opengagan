import { Router, Request, Response, NextFunction } from 'express'
import { DGCA } from '../../../shared/src/constants/dgca'
import type {
  DGCAEntitlement,
  RightsNode,
  RightsEdge,
  RightsRequest,
} from '../../../shared/src/index'

export const rightsRouter = Router()

// POST /rights — body: { flightNumber?, delayMinutes, situation: 'delay'|'cancel'|'denied_boarding' }
rightsRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { delayMinutes, situation } = req.body as RightsRequest

    if (!situation) {
      res.status(400).json({ error: 'situation is required' })
      return
    }

    const entitlements = evaluateRights(delayMinutes ?? 0, situation)
    const { flowNodes, flowEdges } = buildFlowGraph(situation, delayMinutes ?? 0, entitlements)

    res.json({ entitlements, flowNodes, flowEdges })
  } catch (err) {
    next(err)
  }
})

function evaluateRights(delayMinutes: number, situation: string): DGCAEntitlement[] {
  const e: DGCAEntitlement[] = []

  if (situation === 'delay') {
    if (delayMinutes >= DGCA.DELAY_MEALS_MINUTES)
      e.push({ id: 'meals', label: 'Free meals & refreshments', rule: 'CAR S3 M4 §3.3.1' })
    if (delayMinutes >= DGCA.DELAY_COMP_5K_MINUTES)
      e.push({ id: 'comp5k', label: 'Compensation ₹5,000', amount: 5000, rule: 'CAR S3 M4 §3.3.2' })
    if (delayMinutes >= DGCA.DELAY_ALT_FLIGHT_MINUTES) {
      e.push({ id: 'altflight', label: 'Alternate flight OR full refund', rule: 'CAR S3 M4 §3.3.3' })
      e.push({ id: 'comp10k', label: 'Compensation ₹10,000', amount: 10000, rule: 'CAR S3 M4 §3.3.3' })
    }
    if (delayMinutes >= DGCA.DELAY_HOTEL_HOURS * 60)
      e.push({ id: 'hotel', label: 'Hotel accommodation + transfers', rule: 'CAR S3 M4 §3.3.4' })
  }

  if (situation === 'denied_boarding') {
    e.push({
      id: 'denied',
      label: '400% basic fare or ₹20,000 (whichever lower)',
      amount: DGCA.DENIED_BOARDING_COMP,
      rule: 'CAR S3 M4 §4.1',
    })
    e.push({ id: 'meals_db', label: 'Free meals & refreshments', rule: 'CAR S3 M4 §4.2' })
  }

  if (situation === 'cancel') {
    e.push({ id: 'freecancel', label: 'Full refund within 48h of booking', rule: 'DGCA Circular Mar 2026' })
    e.push({ id: 'altflight_c', label: 'Alternate flight at no extra cost', rule: 'CAR S3 M4 §5.1' })
  }

  return e
}

function buildFlowGraph(
  situation: string,
  delayMinutes: number,
  entitlements: DGCAEntitlement[]
): { flowNodes: RightsNode[]; flowEdges: RightsEdge[] } {
  const flowNodes: RightsNode[] = [
    { id: 'start', type: 'start', data: { label: 'Your Flight ✈' } },
    { id: 'q-type', type: 'check', data: { label: `Situation: ${situation}` } },
  ]

  const flowEdges: RightsEdge[] = [
    { id: 'e-start', source: 'start', target: 'q-type' },
  ]

  entitlements.forEach((e, i) => {
    const prev = i === 0 ? 'q-type' : `e-${entitlements[i - 1].id}`
    flowNodes.push({ id: `e-${e.id}`, type: 'entitlement', data: { label: e.label, amount: e.amount, rule: e.rule } })
    flowEdges.push({ id: `edge-${i}`, source: prev, target: `e-${e.id}` })
  })

  flowNodes.push({ id: 'action', type: 'action', data: { label: 'Export PDF → File on AirSewa ↗' } })
  if (entitlements.length > 0) {
    flowEdges.push({
      id: 'edge-action',
      source: `e-${entitlements[entitlements.length - 1].id}`,
      target: 'action',
    })
  } else {
    flowEdges.push({ id: 'edge-action', source: 'q-type', target: 'action' })
  }

  return { flowNodes, flowEdges }
}
