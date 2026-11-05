import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { buyerAccess, visibleListingFilter } from '../../../lib/buyer.js'
import { listingForBuyer } from '../../../lib/serializers.js'
import { escapeRegex } from '../../../lib/admin-users.js'
import { Listing } from '../../../models/Listing.js'

const SORTS = {
  newest: { approvedAt: -1 },
  price_asc: { buyerPrice: 1 },
  price_desc: { buyerPrice: -1 },
  quantity: { quantity: -1 },
}

const GET = route(
  async ({ req, user }) => {
    const { verified, categories } = buyerAccess(user)
    if (!verified) return ok({ locked: true, listings: [], categories: [] })

    const sp = new URL(req.originalUrl, 'http://localhost').searchParams
    const filter = visibleListingFilter(user)
    const category = sp.get('category')
    const q = sp.get('q')?.trim()
    const place = sp.get('place')?.trim()
    const maxPrice = Number(sp.get('maxPrice'))

    if (category && categories.includes(category)) filter.category = category
    const and = []
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i')
      and.push({ $or: [{ title: rx }, { category: rx }, { description: rx }] })
    }
    if (place) {
      const rx = new RegExp(escapeRegex(place), 'i')
      and.push({ $or: [{ city: rx }, { state: rx }] })
    }
    if (and.length) filter.$and = and
    if (maxPrice > 0) filter.buyerPrice = { $ne: null, $lte: maxPrice }

    const listings = await Listing.find(filter)
      .sort(SORTS[sp.get('sort')] ?? SORTS.newest)
      .limit(60)
      .populate('images', 'filename')
      .lean()

    const savedSet = new Set(user.savedListings.map(String))
    return ok({
      locked: false,
      categories,
      listings: listings.map((l) => listingForBuyer(l, { saved: savedSet.has(String(l._id)) })),
    })
  },
  { roles: ['buyer'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
