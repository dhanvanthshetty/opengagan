export interface StateVector {
  icao24: string
  callsign: string | null
  originCountry: string
  timePosition: number | null
  lastContact: number
  longitude: number | null
  latitude: number | null
  baroAltitude: number | null
  onGround: boolean
  velocity: number | null
  trueTrack: number | null
  verticalRate: number | null
  sensors: number[] | null
  geoAltitude: number | null
  squawk: string | null
  spi: boolean
  positionSource: number
}

export interface AircraftState {
  icao24: string
  callsign: string
  originCountry: string
  latitude: number
  longitude: number
  baroAltitude: number
  velocity: number
  trueTrack: number
  verticalRate: number
  onGround: boolean
  timePosition?: number | null
  lastContact?: number | null
  geoAltitude?: number | null
  squawk?: string | null
  spi?: boolean
  positionSource?: number | null
  sensors?: number[] | null
  timestamp: Date
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
}
