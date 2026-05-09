export type AirportType =
  | 'large_airport'
  | 'medium_airport'
  | 'small_airport'
  | 'heliport'
  | 'seaplane_base'
  | 'closed'

export interface Airport {
  _id?: string
  icao: string
  iata?: string
  name: string
  municipality?: string
  type: AirportType
  scheduledService: boolean
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  elevationFt?: number
  country: string
  udanServed?: boolean
  lastSeenFlight?: Date
  wikipediaLink?: string
  photoUrl?: string
  photoSource?: string
  photoStatus?: 'ok' | 'none' | 'rejected'
  photoUpdatedAt?: Date
  latitude?: number
  longitude?: number
}

export interface Runway {
  airportIcao: string
  lengthFt: number
  widthFt: number
  surface: string
  lighted: boolean
  closed: boolean
  leIdent: string
  heIdent: string
  leLatitude?: number
  leLongitude?: number
  heLatitude?: number
  heLongitude?: number
}
