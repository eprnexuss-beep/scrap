import { Router } from 'express'
import { z } from 'zod'
import { route, readJson, ok } from '../../lib/http.js'
import { Notification } from '../../models/Notification.js'

const GET = route(async ({ user }) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(100).lean(),
    Notification.countDocuments({ user: user._id, read: false }),
  ])
  return ok({
    unread,
    items: items.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
    })),
  })
})

const schema = z.object({ ids: z.array(z.string()).optional(), all: z.boolean().optional() })

// Mark some (ids) or all notifications as read.
const POST = route(async ({ req, user }) => {
  const { ids, all } = await readJson(req, schema)
  const filter = { user: user._id, read: false }
  if (!all) filter._id = { $in: ids ?? [] }
  await Notification.updateMany(filter, { $set: { read: true } })
  return ok({ ok: true })
})

const router = Router({ mergeParams: true })
router.get('/', GET)
router.post('/', POST)
export default router
