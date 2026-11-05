import { Router } from 'express'
import { route, ok, ApiError, assertObjectId } from '../../../../lib/http.js'
import { dealForBuyer } from '../../../../lib/serializers.js'
import { Deal } from '../../../../models/Deal.js'

const GET = route(
  async ({ user, params }) => {
    assertObjectId(params.id, 'offer id')
    const d = await Deal.findOne({ _id: params.id, buyer: user._id })
      .populate({ path: 'listing', select: 'title category city state buyerPrice images pickupArea', populate: { path: 'images', select: 'filename', options: { limit: 1 } } })
      .lean()
    if (!d) throw new ApiError(404, 'Offer not found.')
    return ok({ offer: dealForBuyer(d) })
  },
  { roles: ['buyer'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
