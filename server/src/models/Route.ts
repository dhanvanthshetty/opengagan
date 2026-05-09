import { Schema, model, Document } from 'mongoose'

export interface IRoute extends Document {
  originIcao: string
  destIcao: string
  originIata?: string
  destIata?: string
  carrier: string
  monthlyPassengers: number
  year: number
  month: number
}

const RouteSchema = new Schema<IRoute>({
  originIcao: { type: String, required: true },
  destIcao: { type: String, required: true },
  originIata: String,
  destIata: String,
  carrier: String,
  monthlyPassengers: Number,
  year: Number,
  month: Number,
})

RouteSchema.index({ originIcao: 1, destIcao: 1 })
RouteSchema.index({ carrier: 1 })

export const Route = model<IRoute>('Route', RouteSchema)
