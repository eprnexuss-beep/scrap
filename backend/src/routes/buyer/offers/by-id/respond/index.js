import { Router } from 'express'
import { z } from 'zod'
import { route, readJson, ok, ApiError, assertObjectId } from '../../../../../lib/http.js'
import { agreeTerms, pushTimeline } from '../../../../../lib/deals.js'
import { assertCanTrade } from '../../../../../lib/buyer.js'
import { Deal } from '../../../../../models/Deal.js'
import { Listing } from '../../../../../models/Listing.js'
import { User } from '../../../../../models/User.js'
import { notify } from '../../../../../models/Notification.js'
import { audit } from '../../../../../models/AuditLog.js'

const num = (m) => z.number({ message: m }).positive(m).max(1e9)
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('accept') }), // accept EPR Nexuss's counteroffer
  z.object({ action: z.literal('counter'), pricePerUnit: num('Enter your price.'), quantity: num('Enter the quantity.'), note: z.string().trim().max(1000).default('') }),
  z.object({ action: z.literal('withdraw') }),
])

const POST = route(
  async ({ req, user, params }) => {
    assertCanTrade(user)
    const input = await readJson(req, schema)
    assertObjectId(params.id, 'offer id')
    const d = await Deal.findOne({ _id: params.id, buyer: user._id })
    if (!d) throw new ApiError(404, 'Offer not found.')
    const last = d.rounds[d.rounds.length - 1]
    const admins = (await User.find({ role: 'admin' }).select('_id').lean()).map((a) => a._id)

    if (input.action === 'withdraw') {
      if (!['under_review', 'counteroffer'].includes(d.status)) throw new ApiError(409, 'Only open offers can be withdrawn.')
      d.status = 'withdrawn'
      await d.save()
      await notify(admins, { type: 'offer', title: 'Offer withdrawn by buyer', body: d.offerRef, link: `/deal/${d._id}` })
    } else if (input.action === 'accept') {
      if (d.status !== 'counteroffer' || last?.by !== 'admin') throw new ApiError(409, 'There is no counteroffer to accept.')
      await agreeTerms(d, { pricePerUnit: last.pricePerUnit, quantity: last.quantity, by: user._id })
      const listing = await Listing.findById(d.listing).select('ref')
      await notify(admins, { type: 'deal', title: 'Buyer accepted your counteroffer', body: `${d.offerRef} → deal #${d.ref}`, link: `/deal/${d._id}` })
      await notify(d.seller, { type: 'deal', title: 'A deal has been agreed on your lot', body: `${listing?.ref}. EPR Nexuss will coordinate inspection and pickup.`, link: '/seller/deals' })
    } else {
      if (d.status !== 'counteroffer') throw new ApiError(409, 'You can counter once EPR Nexuss has replied.')
      const listing = await Listing.findById(d.listing)
      if (!listing || input.quantity > listing.quantity - listing.reservedQuantity) throw new ApiError(400, 'That quantity is not available on this lot.')
      d.rounds.push({ by: 'buyer', byUser: user._id, pricePerUnit: input.pricePerUnit, quantity: input.quantity, note: input.note })
      d.status = 'under_review'
      pushTimeline(d, 'negotiation', user._id)
      await d.save()
      await notify(admins, { type: 'offer', title: 'Buyer sent a new offer', body: `${d.offerRef} · ₹${input.pricePerUnit}/${d.unit}`, link: `/deal/${d._id}` })
    }

    await audit({ actor: user, action: `offer.${input.action}`, entityType: 'Deal', entityId: d._id, summary: `${d.offerRef} → ${d.status}` })
    return ok({ status: d.status })
  },
  { roles: ['buyer'] },
)

const router = Router({ mergeParams: true })
router.post('/', POST)
export default router
