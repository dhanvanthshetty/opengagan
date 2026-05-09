import { Schema, model, Document } from 'mongoose'

export interface IAircraftState extends Document {
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
  timePosition?: number
  lastContact?: number
  geoAltitude?: number
  squawk?: string
  spi?: boolean
  positionSource?: number
  sensors?: number[]
  timestamp: Date
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
}

const AircraftStateSchema = new Schema<IAircraftState>({
  icao24: String,
  callsign: String,
  originCountry: String,
  latitude: Number,
  longitude: Number,
  baroAltitude: Number,
  velocity: Number,
  trueTrack: Number,
  verticalRate: Number,
  onGround: Boolean,
  timePosition: Number,
  lastContact: Number,
  geoAltitude: Number,
  squawk: String,
  spi: Boolean,
  positionSource: Number,
  sensors: [Number],
  timestamp: { type: Date, default: Date.now },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
})

AircraftStateSchema.index({ icao24: 1, timestamp: -1 })
AircraftStateSchema.index({ location: '2dsphere' })

// Note: create as capped collection in MongoDB Atlas:
// db.createCollection('aircraftstates', { capped: true, size: 5_000_000_000 })

export const AircraftState = model<IAircraftState>('AircraftState', AircraftStateSchema)
