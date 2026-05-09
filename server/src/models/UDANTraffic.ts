import { Schema, model, Document } from 'mongoose'

export interface IUDANTraffic extends Document {
  city: string
  carrier: string
  month: number
  year: number
  passengers: number
  freight: number
}

const UDANTrafficSchema = new Schema<IUDANTraffic>({
  city: { type: String, required: true },
  carrier: String,
  month: Number,
  year: Number,
  passengers: Number,
  freight: Number,
})

UDANTrafficSchema.index({ city: 1, year: 1, month: 1 })
UDANTrafficSchema.index({ carrier: 1 })

export const UDANTraffic = model<IUDANTraffic>('UDANTraffic', UDANTrafficSchema)
