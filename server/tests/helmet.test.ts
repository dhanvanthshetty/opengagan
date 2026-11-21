import express from 'express'
import request from 'supertest'
import { helmetMiddleware } from '../src/middleware/helmet'

describe('helmet middleware', () => {
  test('emits the Strict-Transport-Security max-age of the installed helmet release', async () => {
    const app = express()
    app.use(helmetMiddleware)
    app.get('/', (_req, res) => {
      res.json({ ok: true })
    })

    const response = await request(app).get('/')

    // Helmet 8 defaults HSTS to 365 days (31536000 seconds); Helmet 7 used
    // 180 days (15552000 seconds).
    expect(response.headers['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains'
    )
  })
})
