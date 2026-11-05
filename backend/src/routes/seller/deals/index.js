import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { dealForSeller } from '../../../lib/serializers.js'
import { Deal } from '../../../models/Deal.js'

const GET = route(
  async ({ user }) => {
    const deals = await Deal.find({ seller: user._id, status: { $in: ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered', 'settled', 'cancelled'] }, 'agreed.pricePerUnit': { $ne: null } })
      .sort({ updatedAt: -1 }).limit(200)
      .populate({ path: 'listing', select: 'title ref category images', populate: { path: 'images', select: 'filename', options: { limit: 1 } } })
      .lean()
    const rows = deals.map(dealForSeller)
    const live = rows.filter((r) => !['cancelled'].includes(r.status))
    return ok({
      deals: rows,
      totals: {
        paid: live.filter((r) => r.payout.status === 'confirmed').reduce((s, r) => s + r.sellerAmount, 0),
        pending: live.filter((r) => r.payout.status !== 'confirmed').reduce((s, r) => s + r.sellerAmount, 0),
      },
    })
  },
  { roles: ['seller'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
