import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { userRow, escapeRegex } from '../../../lib/admin-users.js'
import { User } from '../../../models/User.js'

const GET = route(
  async ({ req }) => {
    const url = new URL(req.originalUrl, 'http://localhost')
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')
    const q = url.searchParams.get('q')?.trim()

    const filter = { role: { $ne: 'admin' } }
    if (['seller', 'buyer'].includes(role)) filter.role = role
    if (status) filter.verificationStatus = status
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i')
      filter.$or = [{ companyName: rx }, { email: rx }, { contactPerson: rx }, { gstin: rx }]
    }

    const [users, counts] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).limit(300).lean(),
      User.aggregate([{ $match: { role: { $ne: 'admin' } } }, { $group: { _id: '$verificationStatus', n: { $sum: 1 } } }]),
    ])
    return ok({ users: users.map(userRow), counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
