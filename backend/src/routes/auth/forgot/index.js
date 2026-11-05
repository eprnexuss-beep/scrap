import { Router } from 'express'
import crypto from 'node:crypto'
import { z } from 'zod'
import { route, readJson, ok, ApiError } from '../../../lib/http.js'
import { clientIp, rateLimit } from '../../../lib/rate-limit.js'
import { sendMail, appUrl } from '../../../lib/mailer.js'
import { normalizePhone } from '../../../lib/validators.js'
import { User } from '../../../models/User.js'

const schema = z.object({ identifier: z.string().trim().min(3, 'Enter your email or phone number.') })

const POST = route(
  async ({ req }) => {
    const { identifier } = await readJson(req, schema)

    const limit = rateLimit(`forgot:${clientIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 })
    if (!limit.allowed) throw new ApiError(429, 'Too many requests. Please try again later.')

    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { phone: normalizePhone(identifier) }
    const user = await User.findOne(query)

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000)
      await user.save()
      await sendMail({
        to: user.email,
        subject: 'Reset your EPR Nexuss password',
        text: `Hello ${user.contactPerson},\n\nUse this link to set a new password (valid for 1 hour):\n${appUrl()}/reset-password?token=${token}\n\nIf you didn't req this, you can ignore this email.`,
      })
    }

    // Same answer whether or not the account exists, so emails can't be enumerated.
    return ok({ message: 'If an account exists for that email or phone, reset instructions have been sent.' })
  },
  { auth: false },
)

const router = Router({ mergeParams: true })
router.post('/', POST)
export default router
