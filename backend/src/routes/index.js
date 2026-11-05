import { Router } from 'express'
import r0 from './admin/audit/index.js'
import r1 from './admin/deals/by-id/documents/index.js'
import r2 from './admin/deals/by-id/index.js'
import r3 from './admin/deals/index.js'
import r4 from './admin/listings/by-id/index.js'
import r5 from './admin/listings/index.js'
import r6 from './admin/payments/index.js'
import r7 from './admin/reports/index.js'
import r8 from './admin/settings/pricing/index.js'
import r9 from './admin/summary/index.js'
import r10 from './admin/users/by-id/index.js'
import r11 from './admin/users/index.js'
import r12 from './auth/forgot/index.js'
import r13 from './auth/login/index.js'
import r14 from './auth/logout/index.js'
import r15 from './auth/me/index.js'
import r16 from './auth/register/index.js'
import r17 from './auth/reset/index.js'
import r18 from './buyer/listings/by-id/index.js'
import r19 from './buyer/listings/by-id/save/index.js'
import r20 from './buyer/listings/index.js'
import r21 from './buyer/offers/by-id/proof/index.js'
import r22 from './buyer/offers/by-id/respond/index.js'
import r23 from './buyer/offers/by-id/index.js'
import r24 from './buyer/offers/index.js'
import r25 from './buyer/saved/index.js'
import r26 from './buyer/summary/index.js'
import r27 from './files/by-id/index.js'
import r28 from './me/documents/index.js'
import r29 from './me/password/index.js'
import r30 from './me/index.js'
import r31 from './notifications/index.js'
import r32 from './seller/deals/index.js'
import r33 from './seller/enquiries/index.js'
import r34 from './seller/listings/by-id/close/index.js'
import r35 from './seller/listings/by-id/index.js'
import r36 from './seller/listings/index.js'
import r37 from './seller/summary/index.js'
import r38 from './support/index.js'

// Every REST endpoint, mounted under /api. Folder names mirror the URL.
export function apiRoutes() {
  const api = Router()
  api.use('/admin/audit', r0)
  api.use('/admin/deals/:id/documents', r1)
  api.use('/admin/deals/:id', r2)
  api.use('/admin/deals', r3)
  api.use('/admin/listings/:id', r4)
  api.use('/admin/listings', r5)
  api.use('/admin/payments', r6)
  api.use('/admin/reports', r7)
  api.use('/admin/settings/pricing', r8)
  api.use('/admin/summary', r9)
  api.use('/admin/users/:id', r10)
  api.use('/admin/users', r11)
  api.use('/auth/forgot', r12)
  api.use('/auth/login', r13)
  api.use('/auth/logout', r14)
  api.use('/auth/me', r15)
  api.use('/auth/register', r16)
  api.use('/auth/reset', r17)
  api.use('/buyer/listings/:id', r18)
  api.use('/buyer/listings/:id/save', r19)
  api.use('/buyer/listings', r20)
  api.use('/buyer/offers/:id/proof', r21)
  api.use('/buyer/offers/:id/respond', r22)
  api.use('/buyer/offers/:id', r23)
  api.use('/buyer/offers', r24)
  api.use('/buyer/saved', r25)
  api.use('/buyer/summary', r26)
  api.use('/files/:id', r27)
  api.use('/me/documents', r28)
  api.use('/me/password', r29)
  api.use('/me', r30)
  api.use('/notifications', r31)
  api.use('/seller/deals', r32)
  api.use('/seller/enquiries', r33)
  api.use('/seller/listings/:id/close', r34)
  api.use('/seller/listings/:id', r35)
  api.use('/seller/listings', r36)
  api.use('/seller/summary', r37)
  api.use('/support', r38)
  return api
}
