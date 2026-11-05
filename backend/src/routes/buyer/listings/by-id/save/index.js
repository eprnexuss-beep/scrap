import { Router } from 'express'
import { route, ok, ApiError, assertObjectId } from '../../../../../lib/http.js'
import { visibleListingFilter } from '../../../../../lib/buyer.js'
import { Listing } from '../../../../../models/Listing.js'
import { User } from '../../../../../models/User.js'

// Toggle a lot in the buyer's saved list.
const POST = route(
  async ({ user, params }) => {
    assertObjectId(params.id, 'listing id')
    const already = user.savedListings.some((id) => String(id) === params.id)

    if (already) {
      await User.updateOne({ _id: user._id }, { $pull: { savedListings: params.id } })
      return ok({ saved: false })
    }
    const exists = await Listing.exists({ _id: params.id, ...visibleListingFilter(user) })
    if (!exists) throw new ApiError(404, 'This lot is not available.')
    await User.updateOne({ _id: user._id }, { $addToSet: { savedListings: params.id } })
    return ok({ saved: true })
  },
  { roles: ['buyer'] },
)

const router = Router({ mergeParams: true })
router.post('/', POST)
export default router
