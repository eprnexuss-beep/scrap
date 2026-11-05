import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'
import { escapeRegex } from '../../../lib/admin-users.js'
import { AuditLog } from '../../../models/AuditLog.js'

const GET = route(
  async ({ req }) => {
    const sp = new URL(req.originalUrl, 'http://localhost').searchParams
    const q = sp.get('q')?.trim()
    const before = sp.get('before')
    const filter = {}
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i')
      filter.$or = [{ action: rx }, { summary: rx }, { entityType: rx }]
    }
    if (before) filter.createdAt = { $lt: new Date(before) }

    const rows = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(51).populate('actor', 'companyName').lean()
    const more = rows.length > 50
    return ok({
      more,
      entries: rows.slice(0, 50).map((r) => ({
        id: String(r._id), at: r.createdAt, action: r.action, summary: r.summary, entityType: r.entityType,
        actor: r.actor?.companyName ?? 'System', role: r.actorRole, ip: r.ip,
      })),
    })
  },
  { roles: ['admin'] },
)

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
