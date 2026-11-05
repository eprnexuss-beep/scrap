import { Router } from 'express'
import { route, ok, ApiError, assertObjectId } from '../../../../lib/http.js'
import { buyerAccess, visibleListingFilter } from '../../../../lib/buyer.js'
import { listingForBuyer, dealForBuyer } from '../../../../lib/serializers.js'
import { Listing } from '../../../../models/Listing.js'
import { Deal } from '../../../../models/Deal.js'

const GET = route(
  async ({ user, params }) => {
    assertObjectId(params.id, 'listing id')
    if (!buyerAccess(user).verified) throw new ApiError(403, 'Marketplace access unlocks once your account is verified.')

    // 404 (not 403) for lots outside the buyer's categories so their existence isn't revealed.
    const l = await Listing.findOne({ _id: params.id, ...visibleListingFilter(user) }).populate('images documents').lean()
    if (!l) throw new ApiError(404, 'This lot is not available.')

    const mine = await Deal.findOne({ listing: l._id, buyer: user._id, status: { $in: ['under_review', 'counteroffer'] } })
      .populate('listing', 'title category city state buyerPrice images')
      .lean()

    return ok({
      listing: listingForBuyer(l, { saved: user.savedListings.some((id) => String(id) === String(l._id)) }),
      openOffer: mine ? dealForBuyer(mine) : null,
    })
  },
  { roles: ['buyer'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
