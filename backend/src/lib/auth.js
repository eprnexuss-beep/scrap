import mongoose from 'mongoose'
import { SESSION_COOKIE } from '../config/constants.js'
import { verifySession } from './session.js'
import { User } from '../models/User.js'

/** Resolve the signed-in user for a request (or null). Always re-reads the DB so suspensions apply instantly. */
export async function getCurrentUser(req) {
  const payload = await verifySession(req.cookies?.[SESSION_COOKIE])
  if (!payload?.sub || !mongoose.isValidObjectId(payload.sub)) return null

  const user = await User.findById(payload.sub)
  if (!user || user.verificationStatus === 'suspended') return null

  // A password change invalidates every older session.
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) return null
  return user
}
