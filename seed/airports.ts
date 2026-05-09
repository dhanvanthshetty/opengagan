import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in .env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  // Dynamic import after connection
  const { loadOurAirports } = await import('../server/src/services/ourAirports.loader')
  const result = await loadOurAirports()
  console.log(`Seed complete: ${result.inserted} inserted, ${result.updated} updated`)

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
