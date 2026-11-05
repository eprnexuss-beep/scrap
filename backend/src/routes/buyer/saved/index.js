import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { listingForBuyer } from '../../../lib/serializers.js'
import { Listing } from '../../../models/Listing.js'

const GET = route(
  async ({ user }) => {
    // Saved lots that were later closed/sold simply drop out of the list.
    const listings = await Listing.find({
      _id: { $in: user.savedListings },
      status: { $in: ['active', 'negotiation'] },
      category: { $in: user.categories },
    })
      .populate('images', 'filename')
      .lean()
    return ok({ listings: listings.map((l) => listingForBuyer(l, { saved: true })) })
  },
  { roles: ['buyer'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
