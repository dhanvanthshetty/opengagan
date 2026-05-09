import { Schema, model, Document } from 'mongoose'

export interface IFIRMSHotspot extends Document {
  latitude: number
  longitude: number
  brightness: number
  scan: number
  track: number
  acqDate: string
  acqTime: string
  satellite: string
  confidence: string
  version: string
  brightT31: number
  frp: number
  daynight: string
  nearAirportIcao?: string
  nearAirportDistanceKm?: number
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
}

const FIRMSHotspotSchema = new Schema<IFIRMSHotspot>({
  latitude: Number,
  longitude: Number,
  brightness: Number,
  scan: Number,
  track: Number,
  acqDate: String,
  acqTime: String,
  satellite: String,
  confidence: String,
  version: String,
  brightT31: Number,
  frp: Number,
  daynight: String,
  nearAirportIcao: String,
  nearAirportDistanceKm: Number,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
})

FIRMSHotspotSchema.index({ location: '2dsphere' })
FIRMSHotspotSchema.index({ acqDate: 1 })

export const FIRMSHotspot = model<IFIRMSHotspot>('FIRMSHotspot', FIRMSHotspotSchema)
