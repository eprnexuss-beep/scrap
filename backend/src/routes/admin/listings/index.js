import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { escapeRegex } from '../../../lib/admin-users.js'
import { listingRow } from '../../../lib/serializers.js'
import { Listing } from '../../../models/Listing.js'
import { Deal } from '../../../models/Deal.js'

const GET = route(
  async ({ req }) => {
    const url = new URL(req.originalUrl, 'http://localhost')
    const status = url.searchParams.get('status')
    const q = url.searchParams.get('q')?.trim()

    // Drafts are private to the seller, so admins never see them.
    const filter = { status: { $ne: 'draft' } }
    if (status) filter.status = status
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i')
      filter.$or = [{ title: rx }, { ref: rx }, { category: rx }]
    }

    const [listings, counts] = await Promise.all([
      Listing.find(filter).sort({ updatedAt: -1 }).limit(300).populate('images', 'filename').populate('seller', 'companyName').lean(),
      Listing.aggregate([{ $match: { status: { $ne: 'draft' } } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    ])
    const dealCounts = await Deal.aggregate([
      { $match: { listing: { $in: listings.map((l) => l._id) } } },
      { $group: { _id: '$listing', n: { $sum: 1 } } },
    ])
    const byListing = Object.fromEntries(dealCounts.map((c) => [String(c._id), c.n]))

    return ok({
      listings: listings.map((l) => ({
        ...listingRow(l, byListing[String(l._id)] ?? 0),
        buyerPrice: l.buyerPrice,
        sellerName: l.seller?.companyName ?? '—',
      })),
      counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
    })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
