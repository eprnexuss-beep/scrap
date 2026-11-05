import { SignJWT, jwtVerify } from 'jose'
import { SESSION_COOKIE } from '../config/constants.js'

function secretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is missing or shorter than 32 characters. Set it in backend/.env.')
  }
  return new TextEncoder().encode(secret)
}

const DAY = 60 * 60 * 24
export const sessionMaxAge = (remember) => (remember ? DAY * 30 : DAY * 2)

export async function signSession({ id, role }, remember = false) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(id))
    .setIssuedAt()
    .setExpirationTime(`${sessionMaxAge(remember)}s`)
    .sign(secretKey())
}

export async function verifySession(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    return payload
  } catch {
    return null
  }
}

// COOKIE_SAMESITE=none (+ HTTPS) is only needed if the frontend is hosted on a different site than the API.
function cookieOptions(maxAgeSeconds) {
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase()
  return {
    httpOnly: true,
    sameSite,
    secure: sameSite === 'none' || process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  }
}

export function setSessionCookie(res, token, remember = false) {
  res.cookie(SESSION_COOKIE, token, cookieOptions(sessionMaxAge(remember)))
}

export function clearSessionCookie(res) {
  res.cookie(SESSION_COOKIE, '', cookieOptions(0))
}
