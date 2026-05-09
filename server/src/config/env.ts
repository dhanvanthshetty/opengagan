import { z } from 'zod'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../../.env') })

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  OPENSKY_CLIENT_ID: z.string().optional().default(''),
  OPENSKY_CLIENT_SECRET: z.string().optional().default(''),
  OPENSKY_TOKEN_URL: z
    .string()
    .url()
    .default(
      'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token'
    ),
  OPENSKY_POLL_ALL_DAY: z
    .string()
    .optional()
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
  OPENSKY_POLL_SECONDS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('30'),
  FIRMS_MAP_KEY: z.string().optional().default(''),
  OWM_API_KEY: z.string().optional().default(''),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('4000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  INDIA_LAT_MIN: z.string().transform(Number).default('6.5'),
  INDIA_LAT_MAX: z.string().transform(Number).default('37'),
  INDIA_LON_MIN: z.string().transform(Number).default('68'),
  INDIA_LON_MAX: z.string().transform(Number).default('97.5'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
