import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { route, readJson, ok, ApiError } from '../../../lib/http.js'
import { passwordRule } from '../../../lib/validators.js'
import { signSession, setSessionCookie } from '../../../lib/session.js'
import { clientIp, rateLimit } from '../../../lib/rate-limit.js'
import { User } from '../../../models/User.js'
import { audit } from '../../../models/AuditLog.js'

const schema = z.object({ current: z.string().min(1, 'Enter your current password.'), next: passwordRule })

const POST = route(async ({ req, res, user }) => {
  const { current, next } = readJson(req, schema)
  const limit = rateLimit(`pw:${user._id}`, { limit: 6, windowMs: 15 * 60 * 1000 })
  if (!limit.allowed) throw new ApiError(429, 'Too many attempts. Try again in a few minutes.')

  const full = await User.findById(user._id).select('+passwordHash')
  if (!(await bcrypt.compare(current, full.passwordHash))) throw new ApiError(400, 'Your current password is incorrect.')
  if (current === next) throw new ApiError(400, 'Choose a password different from the current one.')

  full.passwordHash = await bcrypt.hash(next, 12)
  full.passwordChangedAt = new Date()
  await full.save()
  await audit({ actor: user, action: 'user.password_change', entityType: 'User', entityId: user._id, ip: clientIp(req) })

  // Every other device is signed out (older tokens are now invalid); keep this one signed in.
  setSessionCookie(res, await signSession({ id: user._id, role: user.role }, false), false)
  return ok({ ok: true })
})

const router = Router({ mergeParams: true })
router.post('/', POST)
export default router
