import { Router } from 'express'
import { z } from 'zod'
import { route, readJson, ok, ApiError } from '../../../../lib/http.js'
import { Setting, getPricingSettings } from '../../../../models/Setting.js'
import { audit } from '../../../../models/AuditLog.js'

const GET = route(async () => ok({ pricing: await getPricingSettings() }), { roles: ['admin'] })

const schema = z.object({
  defaultMarginType: z.enum(['fixed', 'percentage']),
  defaultMarginValue: z.number({ message: 'Enter the margin amount.' }).min(0).max(10000000),
  offerWindowDays: z.number().int().min(1).max(60),
})

const PUT = route(
  async ({ req, user }) => {
    const value = await readJson(req, schema)
    if (value.defaultMarginType === 'percentage' && value.defaultMarginValue > 100) {
      throw new ApiError(400, 'Percentage margin can’t exceed 100%.')
    }
    await Setting.findByIdAndUpdate('pricing', { value }, { upsert: true })
    await audit({ actor: user, action: 'settings.pricing', entityType: 'Setting', entityId: 'pricing', summary: 'Default margin updated', meta: value })
    return ok({ pricing: value })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
router.put('/', PUT)
export default router
