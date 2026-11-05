import { Router } from 'express'
import { z } from 'zod'
import { route, readJson, ok, ApiError, assertObjectId } from '../../../../lib/http.js'
import { listingFull } from '../../../../lib/serializers.js'
import { userRow } from '../../../../lib/admin-users.js'
import { buyerPriceFor } from '../../../../lib/pricing.js'
import { Listing } from '../../../../models/Listing.js'
import { FileAsset } from '../../../../models/FileAsset.js'
import { Deal } from '../../../../models/Deal.js'
import { getPricingSettings } from '../../../../models/Setting.js'
import { notify } from '../../../../models/Notification.js'
import { audit } from '../../../../models/AuditLog.js'

async function load(id) {
  assertObjectId(id, 'listing id')
  const l = await Listing.findById(id).populate('images documents').populate('seller').lean()
  if (!l || l.status === 'draft') throw new ApiError(404, 'Listing not found.')
  return l
}

const GET = route(
  async ({ params }) => {
    const l = await load(params.id)
    const [settings, enquiries] = await Promise.all([getPricingSettings(), Deal.countDocuments({ listing: l._id })])
    return ok({
      listing: listingFull(l, { enquiries }),
      seller: userRow(l.seller),
      pricingDefaults: settings,
    })
  },
  { roles: ['admin'] },
)

const margin = {
  marginType: z.enum(['fixed', 'percentage']),
  marginValue: z.number({ message: 'Enter the margin amount.' }).min(0, 'Margin can’t be negative.').max(10000000),
}

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    ...margin,
    offerWindowDays: z.number().int().min(1).max(60).default(7),
    documentIds: z.array(z.string()).default([]),
  }),
  z.object({ action: z.literal('reject'), reason: z.string().trim().min(3, 'Give the seller a short reason.').max(1000) }),
  z.object({ action: z.literal('update_pricing'), ...margin, extendDays: z.number().int().min(0).max(60).default(0) }),
  z.object({ action: z.literal('set_documents'), documentIds: z.array(z.string()) }),
])

const PATCH = route(
  async ({ req, user: admin, params }) => {
    const input = await readJson(req, schema)
    assertObjectId(params.id, 'listing id')
    const listing = await Listing.findById(params.id)
    if (!listing || listing.status === 'draft') throw new ApiError(404, 'Listing not found.')

    const setVisibleDocs = async (ids) => {
      const mine = new Set(listing.documents.map(String))
      const visible = ids.filter((id) => mine.has(String(id)))
      await FileAsset.updateMany({ _id: { $in: listing.documents } }, { $set: { buyerVisible: false } })
      if (visible.length) await FileAsset.updateMany({ _id: { $in: visible } }, { $set: { buyerVisible: true } })
    }

    if (input.action === 'approve') {
      if (listing.status !== 'pending') throw new ApiError(409, 'Only listings that are pending approval can be approved.')
      if (input.marginType === 'percentage' && input.marginValue > 100) throw new ApiError(400, 'Percentage margin can’t exceed 100%.')
      listing.marginType = input.marginType
      listing.marginValue = input.marginValue
      listing.buyerPrice = buyerPriceFor(listing.sellerPrice, input.marginType, input.marginValue)
      listing.status = 'active'
      listing.approvedAt = new Date()
      listing.offerWindowEndsAt = new Date(Date.now() + input.offerWindowDays * 864e5)
      listing.reviewedBy = admin._id
      listing.reviewedAt = new Date()
      listing.rejectionReason = ''
      await setVisibleDocs(input.documentIds)
      await listing.save()
      await notify(listing.seller, {
        type: 'listing', title: 'Your listing was approved',
        body: `${listing.ref} · ${listing.title} is now live for verified buyers.`, link: `/seller/listings/${listing._id}`,
      })
    } else if (input.action === 'reject') {
      if (listing.status !== 'pending') throw new ApiError(409, 'Only listings that are pending approval can be rejected.')
      listing.status = 'rejected'
      listing.rejectionReason = input.reason
      listing.reviewedBy = admin._id
      listing.reviewedAt = new Date()
      await listing.save()
      await notify(listing.seller, {
        type: 'listing', title: 'Your listing needs changes',
        body: `${listing.ref}: ${input.reason}`, link: `/seller/listings/${listing._id}`,
      })
    } else if (input.action === 'update_pricing') {
      if (!['active', 'negotiation', 'pending'].includes(listing.status)) throw new ApiError(409, 'Pricing can only be changed on open listings.')
      if (input.marginType === 'percentage' && input.marginValue > 100) throw new ApiError(400, 'Percentage margin can’t exceed 100%.')
      listing.marginType = input.marginType
      listing.marginValue = input.marginValue
      listing.buyerPrice = buyerPriceFor(listing.sellerPrice, input.marginType, input.marginValue)
      if (input.extendDays && listing.offerWindowEndsAt) {
        listing.offerWindowEndsAt = new Date(Math.max(Date.now(), listing.offerWindowEndsAt.getTime()) + input.extendDays * 864e5)
      }
      await listing.save()
    } else {
      await setVisibleDocs(input.documentIds)
    }

    await audit({
      actor: admin,
      action: `listing.${input.action}`,
      entityType: 'Listing',
      entityId: listing._id,
      summary: `${listing.ref} ${listing.title}`,
      meta: input.action === 'reject' ? { reason: input.reason } : input.marginType ? { marginType: input.marginType, marginValue: input.marginValue, buyerPrice: listing.buyerPrice } : {},
    })

    const l = await load(params.id)
    return ok({ listing: listingFull(l) })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
router.patch('/', PATCH)
export default router
