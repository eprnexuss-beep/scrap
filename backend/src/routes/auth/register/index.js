import { Router } from 'express'
import { upload, formData } from '../../../lib/upload.js'
import bcrypt from 'bcryptjs'
import { route, ok, ApiError } from '../../../lib/http.js'
import { collectUploads, storeUploads, deleteAsset } from '../../../lib/files.js'
import { clientIp, rateLimit } from '../../../lib/rate-limit.js'
import { registerSchema, normalizePhone } from '../../../lib/validators.js'
import { User } from '../../../models/User.js'
import { FileAsset } from '../../../models/FileAsset.js'
import { notify } from '../../../models/Notification.js'
import { audit } from '../../../models/AuditLog.js'

const TEXT_FIELDS = [
  'role', 'companyName', 'contactPerson', 'email', 'phone', 'password',
  'businessType', 'gstin', 'city', 'yearsInOperation',
]

const POST = route(
  async ({ req }) => {
    const ip = clientIp(req)
    const form = formData(req)

    const raw = Object.fromEntries(TEXT_FIELDS.map((key) => [key, String(form.get(key) ?? '')]))
    raw.categories = form.getAll('categories').map(String)
    raw.acceptTerms = form.get('acceptTerms') === 'true'
    const data = registerSchema.parse(raw)

    if (data.role === 'buyer' && data.categories.length === 0) {
      throw new ApiError(400, 'Select at least one scrap category you are authorised to process.')
    }

    // Validate every file BEFORE creating anything so a bad upload leaves no half-created account.
    const uploads = await collectUploads(form, 'documents', { allow: ['image', 'pdf'], max: 8 })
    if (uploads.length === 0) {
      throw new ApiError(400, 'Upload at least one verification document (PDF, JPG or PNG).')
    }

    // Only well-formed submissions count toward the limit, so typos never lock anyone out.
    const limit = rateLimit(`register:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 })
    if (!limit.allowed) throw new ApiError(429, 'Too many registration attempts. Please try again later.')

    const phone = normalizePhone(data.phone)
    const existing = await User.findOne({ $or: [{ email: data.email }, { phone }] }).select('email').lean()
    if (existing) {
      const emailTaken = existing.email === data.email
      throw new ApiError(409, emailTaken ? 'An account with this email already exists.' : 'An account with this phone number already exists.')
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    const user = await User.create({
      role: data.role,
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone,
      passwordHash,
      businessType: data.businessType,
      gstin: data.gstin,
      city: data.city,
      yearsInOperation: data.yearsInOperation,
      categories: data.role === 'buyer' ? data.categories : [],
      verificationStatus: 'pending',
    })

    let assets = []
    try {
      assets = await storeUploads(uploads, { kind: 'kyc', owner: user._id, label: 'Verification document' })
      user.documents = assets.map((a) => a._id)
      await user.save()
    } catch (error) {
      await Promise.all(assets.map(deleteAsset))
      await FileAsset.deleteMany({ owner: user._id })
      await User.deleteOne({ _id: user._id })
      throw error
    }

    const admins = await User.find({ role: 'admin' }).select('_id').lean()
    await notify(
      admins.map((a) => a._id),
      {
        type: 'verification',
        title: `New ${data.role === 'buyer' ? 'recycler' : 'seller'} awaiting verification`,
        body: `${data.companyName} submitted ${assets.length} document(s).`,
        link: '/admin-dashboard/verifications',
      },
    )
    await audit({
      actor: user,
      action: 'user.register',
      entityType: 'User',
      entityId: user._id,
      summary: `${data.companyName} registered as ${data.role}`,
      ip,
    })

    return ok({ user: user.toPublic(), documents: assets.length }, 201)
  },
  { auth: false },
)

const router = Router({ mergeParams: true })
router.post('/', upload, POST)
export default router
