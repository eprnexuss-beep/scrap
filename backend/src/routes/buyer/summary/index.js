import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { buyerAccess, visibleListingFilter } from '../../../lib/buyer.js'
import { Listing } from '../../../models/Listing.js'
import { Deal } from '../../../models/Deal.js'

const OPEN = ['under_review', 'counteroffer']
const WON = ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered', 'settled']

const GET = route(
  async ({ user }) => {
    const { verified, categories } = buyerAccess(user)
    const filter = verified ? visibleListingFilter(user) : null

    const [matching, today, activeOffers, won, wonDeals, docs] = await Promise.all([
      filter ? Listing.countDocuments(filter) : 0,
      filter ? Listing.countDocuments({ ...filter, approvedAt: { $gte: new Date(Date.now() - 864e5) } }) : 0,
      Deal.countDocuments({ buyer: user._id, status: { $in: OPEN } }),
      Deal.countDocuments({ buyer: user._id, status: { $in: WON } }),
      Deal.find({ buyer: user._id, status: { $in: WON } }).select('agreed finalQuantity').lean(),
      Promise.resolve(user.documents.length),
    ])
    const purchaseValue = wonDeals.reduce((s, d) => s + (d.agreed?.pricePerUnit ?? 0) * (d.finalQuantity ?? d.agreed?.quantity ?? 0), 0)

    return ok({
      verified, categories, matching, today, activeOffers, won, purchaseValue, documents: docs,
      verificationStatus: user.verificationStatus,
      verifiedAt: user.verifiedAt,
    })
  },
  { roles: ['buyer'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
