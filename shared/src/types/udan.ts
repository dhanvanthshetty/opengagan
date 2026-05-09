export interface UDANRoute {
  originCity: string
  destCity: string
  carrier: string
  routeType: 'RCS' | 'normal'
}

export interface UDANTraffic {
  city: string
  carrier: string
  month: number
  year: number
  passengers: number
  freight: number
}
