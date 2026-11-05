import { Router } from 'express'
import { upload, formData } from '../../../lib/upload.js'
import { route, ok, ApiError } from '../../../lib/http.js'
import { collectUploads, storeUploads } from '../../../lib/files.js'
import { fileDto } from '../../../lib/serializers.js'
import { FileAsset } from '../../../models/FileAsset.js'
import { User } from '../../../models/User.js'
import { notify } from '../../../models/Notification.js'
import { audit } from '../../../models/AuditLog.js'

const MAX_TOTAL = 15

const GET = route(async ({ user }) => {
  const docs = await FileAsset.find({ _id: { $in: user.documents } }).sort({ createdAt: -1 })
  return ok({ documents: docs.map((d) => ({ ...fileDto(d), createdAt: d.createdAt })), verificationStatus: user.verificationStatus })
})

// Add more verification documents (e.g. a renewed licence).
const POST = route(
  async ({ req, user }) => {
    const form = formData(req)
    const uploads = await collectUploads(form, 'documents', { allow: ['image', 'pdf'], max: 5 })
    if (!uploads.length) throw new ApiError(400, 'Choose at least one PDF or image.')
    if (user.documents.length + uploads.length > MAX_TOTAL) throw new ApiError(400, `You can keep at most ${MAX_TOTAL} documents on file.`)

    const assets = await storeUploads(uploads, { kind: 'kyc', owner: user._id, label: 'Verification document' })
    user.documents.push(...assets.map((a) => a._id))
    await user.save()

    const admins = await User.find({ role: 'admin' }).select('_id').lean()
    await notify(admins.map((a) => a._id), { type: 'verification', title: 'Company uploaded new documents', body: user.companyName, link: '/admin-dashboard/users' })
    await audit({ actor: user, action: 'user.documents', entityType: 'User', entityId: user._id, summary: `${assets.length} file(s) added` })
    return ok({ added: assets.length }, 201)
  },
  { roles: ['seller', 'buyer'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
router.post('/', upload, POST)
export default router
