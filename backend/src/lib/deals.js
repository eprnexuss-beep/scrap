import { ApiError } from './http.js'
import { LIVE_STATUSES } from './ledger.js'
import { Listing } from '../models/Listing.js'
import { Deal } from '../models/Deal.js'
import { notify } from '../models/Notification.js'

/** Offers whose validity date has passed stop being open. Cheap; called by list endpoints. */
export async function expireStaleDeals() {
  await Deal.updateMany(
    { status: { $in: ['under_review', 'counteroffer'] }, validUntil: { $ne: null, $lt: new Date() } },
    { $set: { status: 'expired' } },
  )
}

export function pushTimeline(deal, key, by, note = '') {
  if (!deal.timeline.some((t) => t.key === key)) deal.timeline.push({ key, by, note, at: new Date() })
}

/**
 * Lock in commercial terms. The quantity is reserved ATOMICALLY on the listing so two accepted deals
 * can never oversell the same lot, even if two admins click at the same moment.
 */
export async function agreeTerms(deal, { pricePerUnit, sellerPricePerUnit, quantity, by }) {
  const listingBeforeReservation = await Listing.findById(deal.listing).select('status')
  const reserved = await Listing.findOneAndUpdate(
    {
      _id: deal.listing,
      status: { $in: ['active', 'negotiation'] },
      $expr: { $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, quantity] },
    },
    { $inc: { reservedQuantity: quantity }, $set: { status: 'negotiation' } },
    { returnDocument: 'after' },
  )
  if (!reserved) throw new ApiError(409, 'That quantity is no longer available on this lot.')

  const settlementPrice = sellerPricePerUnit == null ? reserved.sellerPrice : Number(sellerPricePerUnit)
  if (!Number.isFinite(settlementPrice) || settlementPrice <= 0 || settlementPrice > pricePerUnit) {
    // Undo the reservation before rejecting invalid commercial terms.
    await Listing.updateOne({ _id: reserved._id }, { $inc: { reservedQuantity: -quantity } })
    const anotherLiveDeal = await Deal.exists({
      listing: reserved._id,
      _id: { $ne: deal._id },
      status: { $in: [...LIVE_STATUSES, 'under_review', 'counteroffer'] },
    })
    await Listing.updateOne(
      { _id: reserved._id },
      { $set: { status: anotherLiveDeal ? 'negotiation' : (listingBeforeReservation?.status ?? 'active') } },
    )
    throw new ApiError(400, settlementPrice > pricePerUnit
      ? 'Seller settlement price cannot exceed the accepted buyer price.'
      : 'Enter a valid negotiated seller settlement price.')
  }

  deal.agreed = { pricePerUnit, quantity, at: new Date() }
  deal.sellerPriceSnapshot = settlementPrice
  deal.listedBuyerPriceSnapshot = reserved.buyerPrice
  deal.status = 'terms_agreed'
  if (deal.rounds.length > 1) pushTimeline(deal, 'negotiation', by)
  pushTimeline(deal, 'terms_agreed', by)
  await deal.save()
  return reserved
}

/** After a deal ends, free its reserved quantity and put the lot back on the market if nothing else is live. */
export async function releaseReservation(deal, { sold = 0 } = {}) {
  const qty = deal.agreed?.quantity ?? 0
  if (!qty) return
  const listing = await Listing.findByIdAndUpdate(
    deal.listing,
    { $inc: { reservedQuantity: -qty, quantity: -sold } },
    { returnDocument: 'after' },
  )
  if (!listing) return
  if (listing.reservedQuantity < 0) listing.reservedQuantity = 0
  const stillLive = await Deal.countDocuments({ listing: listing._id, _id: { $ne: deal._id }, status: { $in: LIVE_STATUSES } })
  if (listing.quantity <= 0) {
    listing.status = 'sold'
    const open = await Deal.find({ listing: listing._id, status: { $in: ['under_review', 'counteroffer'] } }).select('buyer offerRef')
    if (open.length) {
      await Deal.updateMany({ _id: { $in: open.map((o) => o._id) } }, { $set: { status: 'expired' } })
      await Promise.all(open.map((o) => notify(o.buyer, { type: 'deal', title: 'This lot is no longer available', body: `${o.offerRef} was closed because the lot has been sold.`, link: `/buyer/offers/${o._id}` })))
    }
  } else if (!stillLive && listing.status === 'negotiation') listing.status = 'active'
  await listing.save()
}
