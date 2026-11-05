import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { sameOriginGuard, sendError } from './lib/http.js'
import { apiRoutes } from './routes/index.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // correct client IPs behind nginx / a PaaS load balancer

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }))

  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())
  app.use('/api', sameOriginGuard)

  app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }))
  app.use('/api', apiRoutes())
  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }))

  // Optional: serve the built frontend (frontend/dist) from this same server — one origin, no CORS/cookie setup.
  const here = path.dirname(fileURLToPath(import.meta.url))
  const dist = path.resolve(process.env.FRONTEND_DIST || path.join(here, '../../frontend/dist'))
  if (process.env.SERVE_FRONTEND === 'true' && fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }))
    app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(dist, 'index.html')) : next()))
  }

  // Body-parser / multer errors that happen before a route's own try/catch.
  app.use((error, req, res, next) => sendError(res, error))
  return app
}
