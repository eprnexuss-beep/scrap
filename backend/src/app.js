import path from 'node:path'
import cors from 'cors'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { sameOriginGuard, sendError } from './lib/http.js'
import { apiRoutes } from './routes/index.js'

// Production origins + anything listed in CLIENT_URL (comma-separated) + localhost for local dev.
function buildAllowedOrigins() {
  const fromEnv = (process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)

  return new Set([
    'https://eprnexuss.com',
    'https://www.eprnexuss.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173', // vite preview
    'http://127.0.0.1:4173',
    ...fromEnv,
  ])
}

export function createApp() {
  const app = express()
  const allowedOrigins = buildAllowedOrigins()

  app.disable('x-powered-by')
  app.set('trust proxy', 1) // correct client IPs behind nginx / a PaaS load balancer

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header = same-origin request, curl, server-to-server, etc.
        if (!origin) return callback(null, true)
        const clean = origin.replace(/\/$/, '')
        // Not allowed: omit CORS headers (browser blocks it) instead of throwing a 500.
        return callback(null, allowedOrigins.has(clean))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  // 'cross-origin' so uploaded images/PDFs served by the API can load on eprnexuss.com
  // (the API on onrender.com is a different site from the frontend).
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }))

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