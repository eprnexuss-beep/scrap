import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { agreedLedger } from '../../../lib/ledger.js'
import { Deal } from '../../../models/Deal.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const GET = route(
  async () => {
    const [funnel, deals] = await Promise.all([
      Deal.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Deal.find({ 'agreed.pricePerUnit': { $ne: null }, status: { $nin: ['cancelled'] } })
        .populate('listing', 'category title').populate('buyer seller', 'companyName').lean(),
    ])

    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], gmv: 0, revenue: 0, deals: 0 }
    })
    const cats = {}
    const buyers = {}
    const sellers = {}
    let gmv = 0, revenue = 0, settledRevenue = 0, volume = 0

    for (const d of deals) {
      const l = agreedLedger(d)
      gmv += l.buyerAmount
      revenue += l.revenue
      volume += l.quantity
      if (d.status === 'settled') settledRevenue += l.revenue
      const at = new Date(d.agreed.at)
      const m = months.find((x) => x.key === `${at.getFullYear()}-${at.getMonth()}`)
      if (m) { m.gmv += l.buyerAmount; m.revenue += l.revenue; m.deals += 1 }
      const c = (cats[d.listing?.category ?? 'Other'] ??= { name: d.listing?.category ?? 'Other', deals: 0, gmv: 0, revenue: 0 })
      c.deals += 1; c.gmv += l.buyerAmount; c.revenue += l.revenue
      const b = (buyers[d.buyer?.companyName] ??= { name: d.buyer?.companyName, deals: 0, value: 0 }); b.deals += 1; b.value += l.buyerAmount
      const s = (sellers[d.seller?.companyName] ??= { name: d.seller?.companyName, deals: 0, value: 0 }); s.deals += 1; s.value += l.sellerAmount
    }

    const top = (o) => Object.values(o).sort((a, b) => b.value - a.value).slice(0, 5)
    const byStatus = Object.fromEntries(funnel.map((f) => [f._id, f.n]))
    const total = funnel.reduce((s, f) => s + f.n, 0)
    const won = deals.length

    return ok({
      totals: { gmv, revenue, settledRevenue, volume, deals: won, offers: total, conversion: total ? Math.round((won / total) * 100) : 0, avgMargin: gmv ? Math.round((revenue / gmv) * 1000) / 10 : 0 },
      months: months.map(({ key, ...m }) => m),
      categories: Object.values(cats).sort((a, b) => b.gmv - a.gmv),
      topBuyers: top(buyers),
      topSellers: top(sellers),
      funnel: byStatus,
    })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
