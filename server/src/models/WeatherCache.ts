import { Schema, model, Document } from 'mongoose'

export interface IWeatherCache extends Document {
  icao: string
  rvr?: Record<string, number>
  wxCode?: string
  visibility?: number
  windSpeed?: number
  windDir?: number
  temperature?: number
  humidity?: number
  description?: string
  updatedAt: Date
  source: 'amss' | 'owm'
}

const WeatherCacheSchema = new Schema<IWeatherCache>({
  icao: { type: String, required: true, unique: true },
  rvr: { type: Map, of: Number },
  wxCode: String,
  visibility: Number,
  windSpeed: Number,
  windDir: Number,
  temperature: Number,
  humidity: Number,
  description: String,
  updatedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['amss', 'owm'], default: 'owm' },
})

WeatherCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 3600 })

export const WeatherCache = model<IWeatherCache>('WeatherCache', WeatherCacheSchema)
