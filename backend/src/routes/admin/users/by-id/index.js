import { Router } from 'express'
import { z } from 'zod'
import { route, readJson, ok, ApiError, assertObjectId } from '../../../../lib/http.js'
import { userDetail } from '../../../../lib/admin-users.js'
import { CATEGORIES } from '../../../../config/constants.js'
import { User } from '../../../../models/User.js'
import { Listing } from '../../../../models/Listing.js'
import { notify } from '../../../../models/Notification.js'
import { audit } from '../../../../models/AuditLog.js'

const load = async (id) => {
  assertObjectId(id, 'user id')
  const u = await User.findById(id).populate('documents')
  if (!u) throw new ApiError(404, 'User not found.')
  return u
}

const GET = route(
  async ({ params }) => ok({ user: userDetail(await load(params.id)) }),
  { roles: ['admin'] },
)

const schema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'reinstate']),
  note: z.string().trim().max(1000).optional().default(''),
  categories: z.array(z.enum(CATEGORIES)).optional(),
})

const PATCH = route(
  async ({ req, user: admin, params }) => {
    const { action, note, categories } = await readJson(req, schema)
    const target = await load(params.id)
    if (target.role === 'admin') throw new ApiError(403, 'Admin accounts can’t be changed here.')

    if ((action === 'reject' || action === 'suspend') && note.length < 3) {
      throw new ApiError(400, 'Please give a short reason — it is shown to the user.')
    }

    let title = ''
    let body = ''
    if (action === 'approve') {
      if (target.role === 'buyer') {
        const finalCategories = categories ?? target.categories
        if (!finalCategories.length) throw new ApiError(400, 'Select at least one verified category for this recycler.')
        target.categories = finalCategories
      }
      target.verificationStatus = 'approved'
      target.verifiedAt = new Date()
      target.verifiedBy = admin._id
      target.verificationNote = ''
      title = 'Your account has been verified'
      body = target.role === 'buyer'
        ? `You can now browse approved lots in: ${target.categories.join(', ')}.`
        : 'You can now submit scrap listings for approval.'
    } else if (action === 'reject') {
      target.verificationStatus = 'rejected'
      target.verificationNote = note
      title = 'Verification was not approved'
      body = note
    } else if (action === 'suspend') {
      target.verificationStatus = 'suspended'
      target.verificationNote = note
      title = 'Your account has been suspended'
      body = note
      if (target.role === 'seller') {
        // Take their open lots off the market so buyers can't start new offers.
        await Listing.updateMany({ seller: target._id, status: 'active', reservedQuantity: 0 }, { $set: { status: 'closed' } })
      }
    } else {
      target.verificationStatus = target.verifiedAt ? 'approved' : 'pending'
      target.verificationNote = ''
      title = 'Your account has been reinstated'
    }

    await target.save()
    await notify(target._id, { type: 'verification', title, body, link: target.role === 'buyer' ? '/buyer' : '/seller' })
    await audit({
      actor: admin,
      action: `user.${action}`,
      entityType: 'User',
      entityId: target._id,
      summary: `${action} · ${target.companyName}${note ? ` — ${note}` : ''}`,
    })

    return ok({ user: userDetail(await load(params.id)) })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
router.patch('/', PATCH)
export default router
