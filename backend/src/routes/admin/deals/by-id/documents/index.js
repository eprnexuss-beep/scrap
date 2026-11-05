import { Router } from 'express'
import { upload, formData } from '../../../../../lib/upload.js'
import { route, ok, ApiError, assertObjectId } from '../../../../../lib/http.js'
import { collectUploads, storeUploads } from '../../../../../lib/files.js'
import { Deal } from '../../../../../models/Deal.js'
import { audit } from '../../../../../models/AuditLog.js'

// Admin attaches paperwork (weighment slip, invoice, payout proof) to a deal. Admin-only visibility.
const POST = route(
  async ({ req, user, params }) => {
    assertObjectId(params.id, 'deal id')
    const deal = await Deal.findById(params.id).select('ref')
    if (!deal) throw new ApiError(404, 'Deal not found.')
    const form = formData(req)
    const uploads = await collectUploads(form, 'files', { allow: ['image', 'pdf'], max: 5 })
    if (!uploads.length) throw new ApiError(400, 'Choose a PDF or image to attach.')
    const label = String(form.get('label') ?? '').slice(0, 80)
    const assets = await storeUploads(uploads, { kind: 'deal-document', owner: user._id, deal: deal._id, label })
    await audit({ actor: user, action: 'deal.document', entityType: 'Deal', entityId: deal._id, summary: `${deal.ref}: ${assets.length} file(s)` })
    return ok({ count: assets.length }, 201)
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.post('/', upload, POST)
export default router
