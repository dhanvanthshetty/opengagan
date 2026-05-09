import { Schema, model, Document } from 'mongoose'

export interface IAirport extends Document {
  icao: string
  iata?: string
  name: string
  municipality?: string
  type: 'large_airport' | 'medium_airport' | 'small_airport' | 'heliport' | 'seaplane_base' | 'closed'
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
}

const AirportSchema = new Schema<IAirport>({
  icao: { type: String, required: true, unique: true },
  iata: String,
  name: String,
  municipality: String,
  type: {
    type: String,
    enum: ['large_airport', 'medium_airport', 'small_airport', 'heliport', 'seaplane_base', 'closed'],
  },
  scheduledService: Boolean,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number],
  },
  elevationFt: Number,
  country: { type: String, default: 'IN' },
  udanServed: Boolean,
  lastSeenFlight: Date,
  wikipediaLink: String,
  photoUrl: String,
  photoSource: String,
  photoStatus: String,
  photoUpdatedAt: Date,
})

AirportSchema.index({ location: '2dsphere' })
AirportSchema.index({ scheduledService: 1 })
AirportSchema.index({ icao: 1, iata: 1 })

export const Airport = model<IAirport>('Airport', AirportSchema)
