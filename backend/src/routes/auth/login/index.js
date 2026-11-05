import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { route, readJson, ok, ApiError } from '../../../lib/http.js'
import { signSession, setSessionCookie } from '../../../lib/session.js'
import { clientIp, rateLimit, resetLimit } from '../../../lib/rate-limit.js'
import { loginSchema, normalizePhone } from '../../../lib/validators.js'
import { User } from '../../../models/User.js'
import { audit } from '../../../models/AuditLog.js'

// Compared against when the account doesn't exist so response time doesn't reveal which emails are registered.
let dummyHash
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync('not-a-real-password-1', 12))

const ROLE_LABEL = { buyer: 'Recycler', seller: 'Seller', admin: 'Admin' }

const POST = route(
  async ({ req, res }) => {
    const { identifier, password, role, remember } = readJson(req, loginSchema)

    // Only FAILED attempts count toward the lockout; a successful login clears it.
    const limitKey = `login:${clientIp(req)}:${identifier.toLowerCase()}`
    const policy = { limit: 8, windowMs: 15 * 60 * 1000 }
    const limit = rateLimit(limitKey, { ...policy, peek: true })
    if (!limit.allowed) {
      throw new ApiError(429, `Too many failed attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).`)
    }

    const query = identifier.includes('@') ? { email: identifier.toLowerCase() } : { phone: normalizePhone(identifier) }
    const user = await User.findOne(query).select('+passwordHash')

    const valid = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash())
    if (!user || !valid) {
      rateLimit(limitKey, policy) // record the failure
      throw new ApiError(401, 'Incorrect email/phone or password.')
    }
    resetLimit(limitKey)

    if (user.verificationStatus === 'suspended') {
      throw new ApiError(403, 'This account has been suspended. Please contact EPR Nexuss support.')
    }
    if (user.role !== role) {
      throw new ApiError(403, `This account is registered as ${ROLE_LABEL[user.role]}. Choose the "${ROLE_LABEL[user.role]}" tab to sign in.`)
    }

    user.lastLoginAt = new Date()
    await user.save()

    setSessionCookie(res, await signSession({ id: user._id, role: user.role }, remember), remember)
    await audit({ actor: user, action: 'user.login', entityType: 'User', entityId: user._id, ip: clientIp(req) })
    return ok({ user: user.toPublic() })
  },
  { auth: false },
)

const router = Router({ mergeParams: true })
router.post('/', POST)
export default router
