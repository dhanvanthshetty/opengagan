export type RightsSituation = 'delay' | 'cancel' | 'denied_boarding'

export interface DGCAEntitlement {
  id: string
  label: string
  amount?: number
  rule?: string
}

export type RightsNodeType = 'start' | 'check' | 'entitlement' | 'action'

export interface RightsNode {
  id: string
  type: RightsNodeType
  data: {
    label: string
    rule?: string
    amount?: number
  }
}

export interface RightsEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface RightsRequest {
  flightNumber?: string
  delayMinutes: number
  situation: RightsSituation
}

export interface RightsResponse {
  entitlements: DGCAEntitlement[]
  flowNodes: RightsNode[]
  flowEdges: RightsEdge[]
}
