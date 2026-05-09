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

  const { loadVonterUDAN } = await import('../server/src/services/vonterUDAN.loader')
  const result = await loadVonterUDAN()
  console.log(`UDAN seed complete: ${result.inserted} inserted, ${result.updated} updated`)

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
