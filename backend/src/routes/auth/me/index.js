import { Router } from 'express'
import { route, ok } from '../../../lib/http.js'

const GET = route(async ({ user }) => ok({ user: user.toPublic() }))

const router = Router({ mergeParams: true })
router.get('/', GET)
export default router
