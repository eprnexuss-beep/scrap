import { Router } from 'express'
import { upload, formData } from '../../../../lib/upload.js'
import { route, ok, ApiError, assertObjectId } from '../../../../lib/http.js'
import { collectUploads, storeUploads, deleteAsset } from '../../../../lib/files.js'
import { parseListingForm, MAX_IMAGES, MAX_DOCUMENTS } from '../../../../lib/listing-form.js'
import { listingFull } from '../../../../lib/serializers.js'
import { Listing } from '../../../../models/Listing.js'
import { Deal } from '../../../../models/Deal.js'
import { FileAsset } from '../../../../models/FileAsset.js'
import { User } from '../../../../models/User.js'
import { notify } from '../../../../models/Notification.js'
import { audit } from '../../../../models/AuditLog.js'

const EDITABLE = ['draft', 'rejected', 'pending']

async function loadOwn(id, user) {
  assertObjectId(id, 'listing id')
  const listing = await Listing.findOne({ _id: id, seller: user._id })
  if (!listing) throw new ApiError(404, 'Listing not found.')
  return listing
}

const GET = route(
  async ({ user, params }) => {
    assertObjectId(params.id, 'listing id')
    const l = await Listing.findOne({ _id: params.id, seller: user._id }).populate('images documents').lean()
    if (!l) throw new ApiError(404, 'Listing not found.')
    const enquiries = await Deal.countDocuments({ listing: l._id })
    return ok({ listing: listingFull(l, { enquiries }) })
  },
  { roles: ['seller'] },
)

// Edit a draft / rejected / pending listing. Multipart: fields + new images[]/documents[] + removeImages[]/removeDocuments[].
const PATCH = route(
  async ({ req, user, params }) => {
    const listing = await loadOwn(params.id, user)
    if (!EDITABLE.includes(listing.status)) {
      throw new ApiError(409, 'Approved listings can’t be edited. Close this listing and create a new one if details changed.')
    }

    const form = formData(req)
    const intent = form.get('intent') === 'submit' ? 'submit' : 'draft'
    if (intent === 'submit' && user.verificationStatus !== 'approved') {
      throw new ApiError(403, 'Your account must be verified before you can submit listings.')
    }

    const data = parseListingForm(form, intent)
    const removeImages = new Set(form.getAll('removeImages').map(String))
    const removeDocs = new Set(form.getAll('removeDocuments').map(String))

    const keptImages = listing.images.filter((id) => !removeImages.has(String(id)))
    const keptDocs = listing.documents.filter((id) => !removeDocs.has(String(id)))

    const newImages = await collectUploads(form, 'images', { allow: ['image'], max: MAX_IMAGES })
    const newDocs = await collectUploads(form, 'documents', { allow: ['pdf'], max: MAX_DOCUMENTS })
    if (keptImages.length + newImages.length > MAX_IMAGES) throw new ApiError(400, `A listing can have at most ${MAX_IMAGES} photos.`)
    if (keptDocs.length + newDocs.length > MAX_DOCUMENTS) throw new ApiError(400, `A listing can have at most ${MAX_DOCUMENTS} documents.`)
    if (intent === 'submit' && keptImages.length + newImages.length === 0) {
      throw new ApiError(400, 'Add at least one clear photo of the material before submitting.')
    }

    const addedImages = await storeUploads(newImages, { kind: 'listing-image', owner: user._id, listing: listing._id })
    const addedDocs = await storeUploads(newDocs, { kind: 'listing-document', owner: user._id, listing: listing._id })

    const wasPending = listing.status === 'pending'
    Object.assign(listing, data)
    listing.images = [...keptImages, ...addedImages.map((a) => a._id)]
    listing.documents = [...keptDocs, ...addedDocs.map((a) => a._id)]
    listing.status = intent === 'submit' ? 'pending' : 'draft'
    if (intent === 'submit') listing.rejectionReason = ''
    await listing.save()

    // Delete removed files only after the listing no longer points to them.
    const gone = await FileAsset.find({ _id: { $in: [...removeImages, ...removeDocs] }, listing: listing._id })
    await Promise.all(gone.map(deleteAsset))

    if (intent === 'submit' && !wasPending) {
      const admins = await User.find({ role: 'admin' }).select('_id').lean()
      await notify(admins.map((a) => a._id), {
        type: 'listing',
        title: 'Listing resubmitted for approval',
        body: `${user.companyName} submitted ${listing.ref} · ${listing.title}`,
        link: '/admin-dashboard/listings',
      })
    }
    await audit({ actor: user, action: `listing.${intent === 'submit' ? 'submit' : 'update'}`, entityType: 'Listing', entityId: listing._id, summary: `${listing.ref} ${listing.title}` })

    const full = await Listing.findById(listing._id).populate('images documents').lean()
    return ok({ listing: listingFull(full) })
  },
  { roles: ['seller'] },
)

// Delete a draft or rejected listing (and its files).
const DELETE = route(
  async ({ user, params }) => {
    const listing = await loadOwn(params.id, user)
    if (!['draft', 'rejected'].includes(listing.status)) {
      throw new ApiError(409, 'Only draft or rejected listings can be deleted. Close an active listing instead.')
    }
    const assets = await FileAsset.find({ listing: listing._id })
    await Promise.all(assets.map(deleteAsset))
    await Listing.deleteOne({ _id: listing._id })
    await audit({ actor: user, action: 'listing.delete', entityType: 'Listing', entityId: listing._id, summary: `${listing.ref} ${listing.title}` })
    return ok({ ok: true })
  },
  { roles: ['seller'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
router.patch('/', upload, PATCH)
router.delete('/', DELETE)
export default router
