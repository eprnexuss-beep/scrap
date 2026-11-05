import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { agreedLedger } from '../../../lib/ledger.js'
import { Deal } from '../../../models/Deal.js'

const GET = route(
  async () => {
    const deals = await Deal.find({ status: { $in: ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered', 'settled'] } })
      .sort({ updatedAt: -1 }).limit(300)
      .populate('listing', 'title ref').populate('buyer seller', 'companyName').lean()

    const rows = deals.map((d) => {
      const led = agreedLedger(d)
      return {
        id: String(d._id), ref: d.ref, status: d.status, listingTitle: d.listing?.title ?? '—',
        buyer: d.buyer?.companyName, seller: d.seller?.companyName,
        buyerAmount: led.buyerAmount, sellerAmount: led.sellerAmount, revenue: led.revenue,
        buyerPaid: d.buyerPayment?.status === 'confirmed', buyerRef: d.buyerPayment?.reference ?? '',
        proofUploaded: !!d.buyerPayment?.proof,
        sellerPaid: d.sellerPayout?.status === 'confirmed', sellerRef: d.sellerPayout?.reference ?? '',
        updatedAt: d.updatedAt,
      }
    })
    const sum = (f) => rows.reduce((s, r) => s + f(r), 0)
    return ok({
      totals: {
        receivable: sum((r) => (r.buyerPaid ? 0 : r.buyerAmount)),
        payable: sum((r) => (r.sellerPaid ? 0 : r.sellerAmount)),
        revenueSettled: sum((r) => (r.status === 'settled' ? r.revenue : 0)),
        revenuePipeline: sum((r) => (r.status === 'settled' ? 0 : r.revenue)),
      },
      rows,
    })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
