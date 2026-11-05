import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { MulterError } from 'multer'
import { connectDB } from './db.js'
import { getCurrentUser } from './auth.js'

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

// Handlers return ok(data, status) and the wrapper sends it. Handlers that write to `res` themselves return HANDLED.
const OK = Symbol('ok')
export const HANDLED = Symbol('handled')
export const ok = (data = {}, status = 200) => ({ [OK]: true, status, data })

/** Origins allowed to make state-changing requests besides the API's own host (comma-separated CLIENT_URL). */
export const allowedOrigins = () =>
  (process.env.CLIENT_URL || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)

/** CSRF defence for cookie auth: reject cross-site POST/PATCH/PUT/DELETE. Same-origin and allow-listed origins pass. */
export function sameOriginGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  if (!origin) return next()
  const host = req.get('x-forwarded-host') || req.get('host')
  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {}
  if (originHost === host || allowedOrigins().includes(origin.replace(/\/$/, ''))) return next()
  return sendError(res, new ApiError(403, 'Cross-site request blocked.'))
}

export function sendError(res, error) {
  if (res.headersSent) return res.end()
  if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, details: error.details })
  if (error instanceof ZodError) {
    const first = error.issues?.[0]
    return res.status(400).json({ error: first?.message ?? 'Invalid input.', field: first?.path?.join('.'), details: error.issues })
  }
  if (error instanceof MulterError) {
    const tooBig = error.code === 'LIMIT_FILE_SIZE'
    return res.status(tooBig ? 413 : 400).json({ error: tooBig ? 'A file is larger than 10 MB.' : 'Upload failed. Check the files and try again.' })
  }
  if (error?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' })
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: Object.values(error.errors)[0]?.message ?? 'Invalid input.' })
  }
  if (error instanceof mongoose.Error.CastError) return res.status(400).json({ error: 'Invalid identifier.' })
  if (error?.code === 11000) {
    const key = Object.keys(error.keyPattern ?? {})[0] ?? 'value'
    return res.status(409).json({ error: `That ${key} is already in use.`, field: key })
  }
  console.error('[api] unhandled error:', error)
  const dev = process.env.NODE_ENV !== 'production'
  return res.status(500).json({ error: dev ? error?.message || 'Server error.' : 'Something went wrong. Please try again.' })
}

/**
 * Wraps an endpoint: DB connect, auth + role gate, error mapping.
 *   route(async ({ req, res, user, params }) => ok({...}), { roles: ['admin'] })
 * Pass { auth: false } for public endpoints.
 */
export function route(handler, { auth = true, roles, verified = false } = {}) {
  return async (req, res) => {
    try {
      await connectDB()

      let user = null
      if (auth) {
        user = await getCurrentUser(req)
        if (!user) throw new ApiError(401, 'Please sign in to continue.')
        if (roles && !roles.includes(user.role)) throw new ApiError(403, 'You do not have access to this resource.')
        if (verified && user.role !== 'admin' && user.verificationStatus !== 'approved') {
          throw new ApiError(403, 'Your account is still being verified. You can do this once EPR Nexuss approves your documents.')
        }
      }

      const out = await handler({ req, res, user, params: req.params })
      if (out === HANDLED || res.headersSent) return
      if (out && out[OK]) return res.status(out.status).json(out.data)
      return res.json(out ?? { ok: true })
    } catch (error) {
      return sendError(res, error)
    }
  }
}

export function readJson(req, schema) {
  if (req.body === undefined || typeof req.body !== 'object') throw new ApiError(400, 'Request body must be valid JSON.')
  return schema ? schema.parse(req.body) : req.body
}

export function assertObjectId(id, label = 'identifier') {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}.`)
  return id
}
