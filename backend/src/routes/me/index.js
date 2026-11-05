import { Router } from 'express'
import { z } from 'zod'
import { route, readJson, ok, ApiError } from '../../lib/http.js'
import { normalizePhone } from '../../lib/validators.js'
import { audit } from '../../models/AuditLog.js'
import { User } from '../../models/User.js'

const schema = z.object({
  contactPerson: z.string().trim().min(2, 'Enter the contact person’s name.').max(120),
  phone: z.string().trim().refine((v) => normalizePhone(v).length >= 10 && normalizePhone(v).length <= 13, 'Enter a valid phone number.'),
  city: z.string().trim().max(120).default(''),
  businessType: z.string().trim().max(120).default(''),
  yearsInOperation: z.string().trim().max(40).default(''),
})

// Company name, GSTIN, email and categories are verified facts, so only an admin can change them.
const PATCH = route(async ({ req, user }) => {
  const data = await readJson(req, schema)
  const phone = normalizePhone(data.phone)
  if (phone !== user.phone && (await User.exists({ phone, _id: { $ne: user._id } }))) {
    throw new ApiError(409, 'That phone number is already in use.')
  }
  Object.assign(user, { ...data, phone })
  await user.save()
  await audit({ actor: user, action: 'user.profile', entityType: 'User', entityId: user._id })
  return ok({ user: user.toPublic() })
})

const router = Router({ mergeParams: true })
router.patch('/', PATCH)
export default router
