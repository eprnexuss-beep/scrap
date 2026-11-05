import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { User } from '../../../models/User.js'
import { Listing } from '../../../models/Listing.js'
import { Deal } from '../../../models/Deal.js'

const OPEN = ['under_review', 'counteroffer', 'terms_agreed', 'inspection', 'pickup_scheduled', 'delivered']
const AGREED = ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered', 'settled']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const GET = route(
  async () => {
    const monthAgo = new Date(Date.now() - 30 * 864e5)
    const now = new Date()
    const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      sellers, sellersNew, recyclers, recyclersNew, activeListings,
      ongoingDeals, pendingUsers, pendingListings, offersToReview, settlementReviews,
      agreedDeals, byCategory, queueUsers, queueListings, queueDeals,
    ] = await Promise.all([
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'seller', createdAt: { $gte: monthAgo } }),
      User.countDocuments({ role: 'buyer', verificationStatus: 'approved' }),
      User.countDocuments({ role: 'buyer', verificationStatus: 'approved', verifiedAt: { $gte: monthAgo } }),
      Listing.countDocuments({ status: { $in: ['active', 'negotiation'] } }),
      Deal.countDocuments({ status: { $in: OPEN } }),
      User.countDocuments({ verificationStatus: 'pending', role: { $ne: 'admin' } }),
      Listing.countDocuments({ status: 'pending' }),
      Deal.countDocuments({ status: 'under_review' }),
      Deal.countDocuments({ status: 'delivered' }),
      Deal.find({ status: { $in: AGREED } }).select('agreed finalQuantity').lean(),
      Listing.aggregate([
        { $match: { status: { $in: ['active', 'negotiation'] } } },
        { $group: { _id: '$category', n: { $sum: 1 } } },
        { $sort: { n: -1 } },
      ]),
      User.find({ verificationStatus: 'pending', role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(4).select('companyName role createdAt').lean(),
      Listing.find({ status: 'pending' }).sort({ updatedAt: -1 }).limit(4).select('title quantity unit ref updatedAt').lean(),
      Deal.find({ status: { $in: ['under_review', 'delivered'] } }).sort({ updatedAt: -1 }).limit(4).select('ref status updatedAt').lean(),
    ])

    const value = (d) => (d.agreed?.pricePerUnit ?? 0) * (d.finalQuantity ?? d.agreed?.quantity ?? 0)
    const transactionValue = agreedDeals.reduce((sum, d) => sum + value(d), 0)

    // Last 6 calendar months of agreed deal value.
    const buckets = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], value: 0 })
    }
    const recent = await Deal.find({ status: { $in: AGREED }, 'agreed.at': { $gte: sixAgo } }).select('agreed finalQuantity').lean()
    for (const d of recent) {
      const at = new Date(d.agreed.at)
      const b = buckets.find((x) => x.key === `${at.getFullYear()}-${at.getMonth()}`)
      if (b) b.value += value(d)
    }

    const queue = [
      ...queueUsers.map((u) => ({
        type: 'Recycler verification', kind: 'user', id: String(u._id), at: u.createdAt,
        title: u.companyName, status: u.role === 'buyer' ? 'Documents ready' : 'Seller documents', href: '/admin-dashboard/verifications',
      })),
      ...queueListings.map((l) => ({
        type: 'Listing review', kind: 'listing', id: String(l._id), at: l.updatedAt,
        title: `${l.title} · ${l.quantity} ${l.unit}`, status: 'Quality check', href: `/admin-dashboard/listings/${l._id}`,
      })),
      ...queueDeals.map((d) => ({
        type: d.status === 'delivered' ? 'Settlement' : 'Offer review', kind: 'deal', id: String(d._id), at: d.updatedAt,
        title: `Deal #${d.ref}`, status: d.status === 'delivered' ? 'Payment proof' : 'Awaiting decision', href: `/deal/${d._id}`,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 6)

    return ok({
      attention: {
        total: pendingUsers + pendingListings + offersToReview + settlementReviews,
        pendingUsers, pendingListings, offersToReview, settlementReviews,
      },
      metrics: { sellers, sellersNew, recyclers, recyclersNew, activeListings, ongoingDeals, transactionValue },
      monthly: buckets.map(({ label, value }) => ({ label, value })),
      categories: byCategory.map((c) => ({ name: c._id, count: c.n })),
      queue,
    })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
