import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { Listing } from '../../../models/Listing.js'
import { Deal } from '../../../models/Deal.js'

const LIVE = ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered']

const GET = route(
  async ({ user }) => {
    const [activeListings, pendingListings, enquiries, weekEnquiries, ongoing, deals] = await Promise.all([
      Listing.countDocuments({ seller: user._id, status: { $in: ['active', 'negotiation'] } }),
      Listing.countDocuments({ seller: user._id, status: 'pending' }),
      Deal.countDocuments({ seller: user._id }),
      Deal.countDocuments({ seller: user._id, createdAt: { $gte: new Date(Date.now() - 7 * 864e5) } }),
      Deal.countDocuments({ seller: user._id, status: { $in: LIVE } }),
      Deal.find({ seller: user._id, status: { $in: [...LIVE, 'settled'] } })
        .select('sellerPriceSnapshot agreed finalQuantity sellerPayout status')
        .lean(),
    ])

    // Seller is always paid their own private price × final weighed quantity.
    let total = 0
    let pending = 0
    for (const d of deals) {
      const amount = (d.sellerPriceSnapshot ?? 0) * (d.finalQuantity ?? d.agreed?.quantity ?? 0)
      total += amount
      if (d.sellerPayout?.status !== 'confirmed') pending += amount
    }

    return ok({ activeListings, pendingListings, enquiries, weekEnquiries, ongoing, settlement: { total, pending } })
  },
  { roles: ['seller'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
