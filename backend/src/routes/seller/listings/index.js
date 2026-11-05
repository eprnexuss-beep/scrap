import { Router } from 'express'
import { upload, formData } from '../../../lib/upload.js'
import { route, ok, ApiError } from '../../../lib/http.js'
import { collectUploads, storeUploads } from '../../../lib/files.js'
import { parseListingForm, MAX_IMAGES, MAX_DOCUMENTS } from '../../../lib/listing-form.js'
import { listingFull, listingRow } from '../../../lib/serializers.js'
import { Listing } from '../../../models/Listing.js'
import { Deal } from '../../../models/Deal.js'
import { User } from '../../../models/User.js'
import { nextSeq } from '../../../models/Counter.js'
import { notify } from '../../../models/Notification.js'
import { audit } from '../../../models/AuditLog.js'

// List my listings (optionally ?status=active&q=text)
const GET = route(
  async ({ req, user }) => {
    const url = new URL(req.originalUrl, 'http://localhost')
    const status = url.searchParams.get('status')
    const q = url.searchParams.get('q')?.trim()

    const filter = { seller: user._id }
    if (status) filter.status = status
    if (q) filter.$or = [{ title: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { ref: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }]

    const listings = await Listing.find(filter).sort({ updatedAt: -1 }).limit(200).populate('images', 'filename').lean()
    const counts = await Deal.aggregate([
      { $match: { listing: { $in: listings.map((l) => l._id) } } },
      { $group: { _id: '$listing', n: { $sum: 1 } } },
    ])
    const byListing = Object.fromEntries(counts.map((c) => [String(c._id), c.n]))

    return ok({ listings: listings.map((l) => listingRow(l, byListing[String(l._id)] ?? 0)) })
  },
  { roles: ['seller'] },
)

// Create a listing (draft or submit-for-approval). Multipart: fields + images[] + documents[].
const POST = route(
  async ({ req, user }) => {
    const form = formData(req)
    const intent = form.get('intent') === 'submit' ? 'submit' : 'draft'

    if (intent === 'submit' && user.verificationStatus !== 'approved') {
      throw new ApiError(403, 'Your account must be verified before you can submit listings. You can still save this as a draft.')
    }

    const data = parseListingForm(form, intent)
    const images = await collectUploads(form, 'images', { allow: ['image'], max: MAX_IMAGES })
    const documents = await collectUploads(form, 'documents', { allow: ['pdf'], max: MAX_DOCUMENTS })
    if (intent === 'submit' && images.length === 0) {
      throw new ApiError(400, 'Add at least one clear photo of the material before submitting.')
    }

    const seq = await nextSeq('listing')
    const listing = await Listing.create({
      ...data,
      ref: `ENX-L-${24000 + seq}`,
      seller: user._id,
      status: intent === 'submit' ? 'pending' : 'draft',
    })

    try {
      const imageAssets = await storeUploads(images, { kind: 'listing-image', owner: user._id, listing: listing._id })
      const docAssets = await storeUploads(documents, { kind: 'listing-document', owner: user._id, listing: listing._id })
      listing.images = imageAssets.map((a) => a._id)
      listing.documents = docAssets.map((a) => a._id)
      await listing.save()
    } catch (error) {
      await Listing.deleteOne({ _id: listing._id })
      throw error
    }

    if (intent === 'submit') {
      const admins = await User.find({ role: 'admin' }).select('_id').lean()
      await notify(admins.map((a) => a._id), {
        type: 'listing',
        title: 'New listing awaiting approval',
        body: `${user.companyName} submitted ${listing.ref} · ${listing.title}`,
        link: '/admin-dashboard/listings',
      })
    }
    await audit({
      actor: user,
      action: intent === 'submit' ? 'listing.submit' : 'listing.draft',
      entityType: 'Listing',
      entityId: listing._id,
      summary: `${listing.ref} ${listing.title}`,
    })

    const full = await Listing.findById(listing._id).populate('images documents').lean()
    return ok({ listing: listingFull(full) }, 201)
  },
  { roles: ['seller'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
router.post('/', upload, POST)
export default router
