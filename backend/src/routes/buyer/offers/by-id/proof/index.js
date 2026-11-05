import { Router } from 'express'
import { upload, formData } from '../../../../../lib/upload.js'
import { route, ok, ApiError, assertObjectId } from '../../../../../lib/http.js'
import { collectUploads, storeUploads, deleteAsset } from '../../../../../lib/files.js'
import { Deal } from '../../../../../models/Deal.js'
import { FileAsset } from '../../../../../models/FileAsset.js'
import { User } from '../../../../../models/User.js'
import { notify } from '../../../../../models/Notification.js'

// Buyer uploads proof of payment (PDF/image). Only the buyer and admins can ever open it.
const POST = route(
  async ({ req, user, params }) => {
    assertObjectId(params.id, 'offer id')
    const d = await Deal.findOne({ _id: params.id, buyer: user._id })
    if (!d) throw new ApiError(404, 'Offer not found.')
    if (!['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered'].includes(d.status) || d.buyerPayment.status === 'confirmed') {
      throw new ApiError(409, 'Payment proof can’t be added to this deal right now.')
    }
    const form = formData(req)
    const uploads = await collectUploads(form, 'proof', { allow: ['image', 'pdf'], max: 1 })
    if (!uploads.length) throw new ApiError(400, 'Choose a PDF or image of your payment receipt.')

    const [asset] = await storeUploads(uploads, { kind: 'deal-document', owner: user._id, deal: d._id, label: 'Buyer payment proof' })
    if (d.buyerPayment.proof) await deleteAsset(await FileAsset.findById(d.buyerPayment.proof))
    d.buyerPayment.proof = asset._id
    await d.save()

    const admins = await User.find({ role: 'admin' }).select('_id').lean()
    await notify(admins.map((a) => a._id), { type: 'payment', title: 'Buyer uploaded payment proof', body: `Deal #${d.ref}`, link: `/deal/${d._id}` })
    return ok({ ok: true }, 201)
  },
  { roles: ['buyer'] },
)

const router = Router({ mergeParams: true })
router.post('/', upload, POST)
export default router
