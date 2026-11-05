import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { expireStaleDeals } from '../../../lib/deals.js'
import { escapeRegex } from '../../../lib/admin-users.js'
import { agreedLedger, proposedLedger } from '../../../lib/ledger.js'
import { Deal } from '../../../models/Deal.js'
import { User } from '../../../models/User.js'
import { Listing } from '../../../models/Listing.js'

const GROUPS = {
  attention: ['under_review', 'delivered'],
  negotiating: ['under_review', 'counteroffer'],
  live: ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered'],
  settled: ['settled'],
  closed: ['rejected', 'withdrawn', 'cancelled', 'expired'],
  offerclosed: ['rejected', 'withdrawn', 'expired'],
  cancelled: ['cancelled'],
}

const GET = route(
  async ({ req }) => {
    await expireStaleDeals()
    const sp = new URL(req.originalUrl, 'http://localhost').searchParams
    const group = sp.get('group')
    const q = sp.get('q')?.trim()

    const filter = {}
    if (GROUPS[group]) filter.status = { $in: GROUPS[group] }
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i')
      const [listings, users] = await Promise.all([
        Listing.find({ $or: [{ title: rx }, { ref: rx }] }).select('_id').lean(),
        User.find({ companyName: rx }).select('_id').lean(),
      ])
      filter.$or = [{ ref: rx }, { offerRef: rx }, { listing: { $in: listings.map((l) => l._id) } }, { buyer: { $in: users.map((u) => u._id) } }, { seller: { $in: users.map((u) => u._id) } }]
    }

    const [deals, all] = await Promise.all([
      Deal.find(filter).sort({ updatedAt: -1 }).limit(200)
        .populate('listing', 'title ref sellerPrice category')
        .populate('buyer seller', 'companyName').lean(),
      Deal.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    ])
    const byStatus = Object.fromEntries(all.map((a) => [a._id, a.n]))
    const count = (g) => GROUPS[g].reduce((s, k) => s + (byStatus[k] ?? 0), 0)

    return ok({
      counts: Object.fromEntries(Object.keys(GROUPS).map((g) => [g, count(g)])),
      deals: deals.map((d) => {
        const lastBuyer = [...d.rounds].reverse().find((r) => r.by === 'buyer')
        const agreed = d.agreed?.pricePerUnit != null
        const led = agreed ? agreedLedger(d) : proposedLedger(d.listing?.sellerPrice, lastBuyer)
        const last = d.rounds[d.rounds.length - 1]
        return {
          id: String(d._id), ref: d.ref, offerRef: d.offerRef, status: d.status, unit: d.unit,
          listingTitle: d.listing?.title ?? '—', category: d.listing?.category,
          buyer: d.buyer?.companyName ?? '—', seller: d.seller?.companyName ?? '—',
          rounds: d.rounds.length, latest: last ? { by: last.by, pricePerUnit: last.pricePerUnit, quantity: last.quantity } : null,
          revenue: led.revenue, buyerAmount: led.buyerAmount, updatedAt: d.updatedAt, createdAt: d.createdAt,
        }
      }),
    })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
