import { Router } from 'express'
import { route, ok, ApiError, assertObjectId } from '../../../../../lib/http.js'
import { Listing } from '../../../../../models/Listing.js'
import { Deal } from '../../../../../models/Deal.js'
import { audit } from '../../../../../models/AuditLog.js'

const POST = route(
  async ({ user, params }) => {
    assertObjectId(params.id, 'listing id')
    const listing = await Listing.findOne({ _id: params.id, seller: user._id })
    if (!listing) throw new ApiError(404, 'Listing not found.')
    if (!['active', 'pending'].includes(listing.status)) {
      throw new ApiError(409, 'Only active or pending listings can be closed.')
    }
    const live = await Deal.countDocuments({
      listing: listing._id,
      status: { $in: ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered'] },
    })
    if (live > 0) throw new ApiError(409, 'This listing has a deal in progress and can’t be closed until it completes.')

    listing.status = 'closed'
    await listing.save()
    await audit({ actor: user, action: 'listing.close', entityType: 'Listing', entityId: listing._id, summary: listing.ref })
    return ok({ ok: true })
  },
  { roles: ['seller'] },
)

const router = Router({ mergeParams: true })
router.post('/', POST)
export default router
