import { Router } from 'express'
import { z } from 'zod'
import { route, readJson, ok, ApiError, assertObjectId } from '../../../lib/http.js'
import { assertCanTrade, visibleListingFilter } from '../../../lib/buyer.js'
import { dealForBuyer } from '../../../lib/serializers.js'
import { Listing } from '../../../models/Listing.js'
import { Deal } from '../../../models/Deal.js'
import { User } from '../../../models/User.js'
import { nextSeq } from '../../../models/Counter.js'
import { notify } from '../../../models/Notification.js'
import { audit } from '../../../models/AuditLog.js'

const GET = route(
  async ({ user }) => {
    const deals = await Deal.find({ buyer: user._id })
      .sort({ updatedAt: -1 })
      .limit(200)
      .populate({ path: 'listing', select: 'title category city state buyerPrice images pickupArea', populate: { path: 'images', select: 'filename', options: { limit: 1 } } })
      .lean()
    return ok({ offers: deals.map(dealForBuyer) })
  },
  { roles: ['buyer'] },
)

const schema = z.object({
  listingId: z.string(),
  pricePerUnit: z.number({ message: 'Enter your offer price.' }).positive('Enter your offer price.').max(1e9),
  quantity: z.number({ message: 'Enter the quantity you want.' }).positive('Enter the quantity you want.').max(1e9),
  validUntil: z.string().optional().nullable(),
  message: z.string().trim().max(1000).optional().default(''),
})

const POST = route(
  async ({ req, user }) => {
    assertCanTrade(user)
    const input = await readJson(req, schema)
    assertObjectId(input.listingId, 'listing id')

    const listing = await Listing.findOne({ _id: input.listingId, ...visibleListingFilter(user) })
    if (!listing) throw new ApiError(404, 'This lot is not available for offers.')

    const available = listing.quantity - listing.reservedQuantity
    if (input.quantity > available) throw new ApiError(400, `Only ${available} ${listing.unit} is available on this lot.`)

    let validUntil = null
    if (input.validUntil) {
      validUntil = new Date(`${input.validUntil}T23:59:59`)
      if (Number.isNaN(validUntil.getTime()) || validUntil < new Date()) throw new ApiError(400, 'Choose a validity date in the future.')
    }

    const open = await Deal.exists({ listing: listing._id, buyer: user._id, status: { $in: ['under_review', 'counteroffer', 'terms_agreed', 'inspection', 'pickup_scheduled', 'delivered'] } })
    if (open) throw new ApiError(409, 'You already have an offer in progress on this lot. Track it under My Offers.')

    const [offerSeq, dealSeq] = [await nextSeq('offer'), await nextSeq('deal')]
    const deal = await Deal.create({
      ref: `ENX${new Date().getFullYear()}-${String(dealSeq).padStart(4, '0')}`,
      offerRef: `OFR-${2400 + offerSeq}`,
      listing: listing._id,
      seller: listing.seller,
      buyer: user._id,
      unit: listing.unit,
      validUntil,
      status: 'under_review',
      rounds: [{ by: 'buyer', byUser: user._id, pricePerUnit: input.pricePerUnit, quantity: input.quantity, note: input.message }],
      timeline: [{ key: 'offer_submitted', by: user._id }],
    })

    const admins = await User.find({ role: 'admin' }).select('_id').lean()
    await notify(admins.map((a) => a._id), {
      type: 'offer', title: 'New private offer to review',
      body: `${deal.offerRef} · ${listing.title} · ₹${input.pricePerUnit}/${listing.unit} × ${input.quantity}`,
      link: `/deal/${deal._id}`,
    })
    await notify(listing.seller, {
      type: 'enquiry', title: 'New enquiry on your listing',
      body: `A verified recycler is interested in ${listing.ref} · ${listing.title}.`, link: '/seller/enquiries',
    })
    await audit({ actor: user, action: 'offer.create', entityType: 'Deal', entityId: deal._id, summary: `${deal.offerRef} on ${listing.ref}` })

    return ok({ offer: { id: String(deal._id), offerRef: deal.offerRef } }, 201)
  },
  { roles: ['buyer'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
router.post('/', POST)
export default router
