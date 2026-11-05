import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { route, readJson, ok, ApiError } from '../../../lib/http.js'
import { clientIp, rateLimit } from '../../../lib/rate-limit.js'
import { passwordRule } from '../../../lib/validators.js'
import { User } from '../../../models/User.js'
import { audit } from '../../../models/AuditLog.js'

const schema = z.object({ token: z.string().min(20), password: passwordRule })

const POST = route(
  async ({ req }) => {
    const { token, password } = await readJson(req, schema)

    const limit = rateLimit(`reset:${clientIp(req)}`, { limit: 10, windowMs: 60 * 60 * 1000 })
    if (!limit.allowed) throw new ApiError(429, 'Too many attempts. Please try again later.')

    const hash = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } }).select(
      '+resetTokenHash +resetTokenExpires',
    )
    if (!user) throw new ApiError(400, 'This reset link is invalid or has expired. Request a new one.')

    user.passwordHash = await bcrypt.hash(password, 12)
    user.passwordChangedAt = new Date()
    user.resetTokenHash = undefined
    user.resetTokenExpires = undefined
    await user.save()

    await audit({ actor: user, action: 'user.password_reset', entityType: 'User', entityId: user._id, ip: clientIp(req) })
    return ok({ message: 'Password updated. You can now sign in.' })
  },
  { auth: false },
)

const router = Router({ mergeParams: true })
router.post('/', POST)
export default router
