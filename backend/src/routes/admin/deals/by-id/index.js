import { Router } from 'express'
import { z } from 'zod'
import { route, readJson, ok, ApiError, assertObjectId } from '../../../../lib/http.js'
import { agreeTerms, releaseReservation, pushTimeline } from '../../../../lib/deals.js'
import { dealForAdmin } from '../../../../lib/serializers.js'
import { agreedLedger, NEXT_STAGE, OPEN_NEGOTIATION } from '../../../../lib/ledger.js'
import { Deal } from '../../../../models/Deal.js'
import { FileAsset } from '../../../../models/FileAsset.js'
import { notify } from '../../../../models/Notification.js'
import { audit } from '../../../../models/AuditLog.js'

async function load(id) {
  assertObjectId(id, 'deal id')
  const d = await Deal.findById(id)
    .populate('listing').populate('buyer seller')
    .populate('internalNotes.by', 'companyName')
    .populate('buyerPayment.proof sellerPayout.proof', '_id')
  if (!d) throw new ApiError(404, 'Deal not found.')
  return d
}

async function present(id) {
  const d = await load(id)
  const [documents, competing] = await Promise.all([
    FileAsset.find({ deal: d._id, kind: 'deal-document' }).sort({ createdAt: -1 }),
    Deal.countDocuments({ listing: d.listing._id, _id: { $ne: d._id }, status: { $in: OPEN_NEGOTIATION } }),
  ])
  return dealForAdmin(d.toObject(), { documents, competing })
}

const GET = route(async ({ params }) => ok({ deal: await present(params.id) }), { roles: ['admin'] })

const num = (m) => z.number({ message: m }).positive(m).max(1e9)
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('accept'), sellerPricePerUnit: num('Enter the negotiated seller settlement price.') }),
  z.object({ action: z.literal('counter'), pricePerUnit: num('Enter the counter price.'), quantity: num('Enter the quantity.'), note: z.string().trim().max(1000).default('') }),
  z.object({ action: z.literal('reject'), note: z.string().trim().min(3, 'Add a short reason.').max(1000) }),
  z.object({ action: z.literal('advance'), note: z.string().trim().max(1000).default(''), scheduledFor: z.string().optional().nullable(), finalQuantity: z.number().positive().max(1e9).optional() }),
  z.object({ action: z.literal('payment'), party: z.enum(['buyer', 'seller']), reference: z.string().trim().min(2, 'Enter the bank / UTR reference.').max(120) }),
  z.object({ action: z.literal('cancel'), note: z.string().trim().min(3, 'Add a short reason.').max(1000) }),
  z.object({ action: z.literal('note'), text: z.string().trim().min(1, 'Write a note first.').max(2000) }),
])

const PATCH = route(
  async ({ req, user: admin, params }) => {
    const input = await readJson(req, schema)
    const d = await load(params.id)
    const listing = d.listing
    const lastRound = d.rounds[d.rounds.length - 1]
    const buyerId = d.buyer._id
    const here = `/buyer/offers/${d._id}`

    switch (input.action) {
      case 'accept': {
        if (d.status !== 'under_review' || lastRound?.by !== 'buyer') throw new ApiError(409, 'There is no buyer offer waiting for a decision.')
        if (input.sellerPricePerUnit > lastRound.pricePerUnit) throw new ApiError(400, 'Seller settlement price cannot exceed the accepted buyer price.')
        await agreeTerms(d, { pricePerUnit: lastRound.pricePerUnit, sellerPricePerUnit: input.sellerPricePerUnit, quantity: lastRound.quantity, by: admin._id })
        await notify(buyerId, { type: 'deal', title: 'Your offer was accepted', body: `${d.offerRef} · terms agreed at ₹${lastRound.pricePerUnit}/${d.unit}. Deal #${d.ref}.`, link: here })
        await notify(d.seller._id, { type: 'deal', title: 'A deal has been agreed on your lot', body: `${listing.ref} · ${lastRound.quantity} ${d.unit}. EPR Nexuss will coordinate inspection and pickup.`, link: '/seller/deals' })
        break
      }
      case 'counter': {
        if (!OPEN_NEGOTIATION.includes(d.status) || d.status === 'counteroffer') throw new ApiError(409, 'This offer can’t be countered right now.')
        d.rounds.push({ by: 'admin', byUser: admin._id, pricePerUnit: input.pricePerUnit, quantity: input.quantity, note: input.note })
        d.status = 'counteroffer'
        pushTimeline(d, 'negotiation', admin._id)
        await d.save()
        await notify(buyerId, { type: 'deal', title: 'You have a counteroffer', body: `${d.offerRef} · ₹${input.pricePerUnit}/${d.unit} for ${input.quantity} ${d.unit}.`, link: here })
        break
      }
      case 'reject': {
        if (!OPEN_NEGOTIATION.includes(d.status)) throw new ApiError(409, 'Only open offers can be rejected.')
        d.status = 'rejected'
        d.internalNotes.push({ by: admin._id, text: `Rejected: ${input.note}` })
        await d.save()
        await notify(buyerId, { type: 'deal', title: 'Your offer was not accepted', body: `${d.offerRef}: ${input.note}`, link: here })
        break
      }
      case 'advance': {
        const next = NEXT_STAGE[d.status]
        if (!next) throw new ApiError(409, 'This deal can’t move forward from its current status.')
        if (next === 'pickup_scheduled') {
          if (input.finalQuantity) {
            if (input.finalQuantity > d.agreed.quantity * 1.1) throw new ApiError(400, 'Weighed quantity can’t exceed the agreed quantity by more than 10%.')
            d.finalQuantity = input.finalQuantity
          }
          if (input.scheduledFor) {
            const when = new Date(input.scheduledFor)
            if (Number.isNaN(when.getTime())) throw new ApiError(400, 'Enter a valid pickup date.')
            d.pickup.scheduledFor = when
          }
          d.pickup.notes = input.note
        }
        if (next === 'settled') {
          if (d.buyerPayment.status !== 'confirmed') throw new ApiError(409, 'Confirm the buyer’s payment before settling.')
          if (d.sellerPayout.status !== 'confirmed') throw new ApiError(409, 'Confirm the seller payout before settling.')
        }
        d.status = next
        pushTimeline(d, next, admin._id, input.note)
        await d.save()
        if (next === 'settled') await releaseReservation(d, { sold: d.finalQuantity ?? d.agreed.quantity })
        const label = { inspection: 'Inspection & weighment started', pickup_scheduled: 'Pickup scheduled', delivered: 'Material delivered', settled: 'Deal settled' }[next]
        await notify(d.seller._id, { type: 'deal', title: label, body: `${listing.ref} · ${listing.title}`, link: '/seller/deals' })
        await notify(buyerId, { type: 'deal', title: label, body: `Deal #${d.ref}`, link: here })
        break
      }
      case 'payment': {
        if (!['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered'].includes(d.status)) throw new ApiError(409, 'Payments can be recorded once terms are agreed and before settlement.')
        const led = agreedLedger(d)
        if (input.party === 'seller' && d.buyerPayment.status !== 'confirmed') throw new ApiError(409, 'Confirm the buyer’s payment before paying out the seller.')
        const slot = input.party === 'buyer' ? 'buyerPayment' : 'sellerPayout'
        d[slot].status = 'confirmed'
        d[slot].amount = input.party === 'buyer' ? led.buyerAmount : led.sellerAmount
        d[slot].reference = input.reference
        d[slot].confirmedAt = new Date()
        await d.save()
        if (input.party === 'buyer') await notify(buyerId, { type: 'payment', title: 'Payment received', body: `We confirmed your payment for deal #${d.ref}.`, link: here })
        else await notify(d.seller._id, { type: 'payment', title: 'Settlement paid out', body: `₹${led.sellerAmount.toLocaleString('en-IN')} for ${listing.ref}. Ref: ${input.reference}`, link: '/seller/settlements' })
        break
      }
      case 'cancel': {
        if (!['terms_agreed', 'inspection', 'pickup_scheduled'].includes(d.status)) throw new ApiError(409, 'Only deals that haven’t been delivered can be cancelled.')
        d.status = 'cancelled'
        d.internalNotes.push({ by: admin._id, text: `Cancelled: ${input.note}` })
        await d.save()
        await releaseReservation(d)
        await notify(buyerId, { type: 'deal', title: 'Deal cancelled', body: `Deal #${d.ref}: ${input.note}`, link: here })
        await notify(d.seller._id, { type: 'deal', title: 'Deal cancelled', body: `Your lot ${listing.ref} is back on the market.`, link: '/seller/deals' })
        break
      }
      case 'note': {
        d.internalNotes.push({ by: admin._id, text: input.text })
        await d.save()
        break
      }
    }

    await audit({ actor: admin, action: `deal.${input.action}`, entityType: 'Deal', entityId: d._id, summary: `${d.ref} ${d.offerRef} → ${d.status}`, meta: input.action === 'note' ? {} : { status: d.status } })
    return ok({ deal: await present(params.id) })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
router.patch('/', PATCH)
export default router
