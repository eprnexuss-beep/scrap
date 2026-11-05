import { Router } from 'express'
import { clearSessionCookie } from '../../../lib/session.js'

const router = Router({ mergeParams: true })
router.post('/', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})
export default router
