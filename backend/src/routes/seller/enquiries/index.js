import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { expireStaleDeals } from '../../../lib/deals.js'
import { Deal } from '../../../models/Deal.js'

// Anonymised: the seller learns that interest exists, never who it is or what they offered.
const GET = route(
  async ({ user }) => {
    await expireStaleDeals()
    const deals = await Deal.find({ seller: user._id }).sort({ createdAt: -1 }).limit(200)
      .populate('listing', 'title ref images category').lean()
    const state = (s) => (['under_review', 'counteroffer'].includes(s) ? 'Open' : ['rejected', 'withdrawn', 'expired', 'cancelled'].includes(s) ? 'Closed' : 'Deal agreed')
    return ok({
      enquiries: deals.map((d) => ({
        id: String(d._id),
        listing: d.listing ? { id: String(d.listing._id), title: d.listing.title, ref: d.listing.ref, category: d.listing.category } : null,
        requestedQuantity: d.rounds[0]?.quantity ?? 0,
        unit: d.unit,
        state: state(d.status),
        createdAt: d.createdAt,
      })),
    })
  },
  { roles: ['seller'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
