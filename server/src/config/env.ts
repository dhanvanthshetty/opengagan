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
    .optional()
    .default('30')
    .transform(Number)
    .pipe(z.number().int().positive()),
  FIRMS_MAP_KEY: z.string().optional().default(''),
  OWM_API_KEY: z.string().optional().default(''),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  PORT: z
    .string()
    .optional()
    .default('4000')
    .transform(Number)
    .pipe(z.number().int().positive()),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  INDIA_LAT_MIN: z.string().optional().default('6.5').transform(Number),
  INDIA_LAT_MAX: z.string().optional().default('37').transform(Number),
  INDIA_LON_MIN: z.string().optional().default('68').transform(Number),
  INDIA_LON_MAX: z.string().optional().default('97.5').transform(Number),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
