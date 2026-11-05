import { Router } from 'express'
import { clientIp, rateLimit } from '../../lib/rate-limit.js'

const router = Router()

const clean = (value, maxLength) =>
  String(value ?? '').trim().slice(0, maxLength)

router.post('/', async (req, res) => {
  const {
    name: rawName,
    phone: rawPhone,
    email: rawEmail,
    type: rawType,
    issue: rawIssue,
    manualQuery: rawManualQuery,
  } = req.body || {}

  const name = clean(rawName, 120)
  const phone = clean(rawPhone, 30)
  const email = clean(rawEmail, 160)
  const type = clean(rawType, 20)
  const issue = clean(rawIssue, 160)
  const manualQuery = clean(rawManualQuery, 2000)

  if (!name || !phone || !email || !type || !issue) {
    return res.status(400).json({
      success: false,
      error: 'Please complete all required fields.',
    })
  }

  if (!['Buyer', 'Seller'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Please select Buyer or Seller.',
    })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address.',
    })
  }

  if (issue === 'Other' && !manualQuery) {
    return res.status(400).json({
      success: false,
      error: 'Please describe your query when selecting Other.',
    })
  }

  // Public endpoint that writes to your Google Sheet: cap valid submissions per IP so a bot can't flood the sheet.
  // (Only well-formed submissions count, so typos never lock a real visitor out.)
  const limit = rateLimit(`support:${clientIp(req)}`, { limit: 6, windowMs: 60 * 60 * 1000 })
  if (!limit.allowed) {
    return res.status(429).json({ success: false, error: 'Too many enquiries from this connection. Please try again later or call us.' })
  }

  // This backend belongs to the Scrap Marketplace. The credit marketplace
  // has its own backend and continues to send "contact_support".
  const action = 'scrap_support'
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim()

  if (!scriptUrl) {
    console.error('[support] GOOGLE_APPS_SCRIPT_URL is missing')
    return res.status(503).json({
      success: false,
      error: 'Contact form is not configured on the server. Please contact support directly.',
    })
  }

  let parsedUrl
  try {
    parsedUrl = new URL(scriptUrl)
  } catch {
    console.error('[support] GOOGLE_APPS_SCRIPT_URL is not a valid URL')
    return res.status(503).json({
      success: false,
      error: 'Contact form integration URL is invalid.',
    })
  }

  if (
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.hostname !== 'script.google.com' ||
    !parsedUrl.pathname.includes('/macros/s/') ||
    !parsedUrl.pathname.endsWith('/exec')
  ) {
    console.error('[support] Expected a deployed Google Apps Script /exec URL')
    return res.status(503).json({
      success: false,
      error: 'Use the deployed Google Apps Script Web App URL ending in /exec.',
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    console.log(`[support] Forwarding Scrap enquiry to Apps Script (action=${action})`)

    const upstreamResponse = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        action,
        name,
        phone,
        email,
        type,
        issue,
        manualQuery,
      }),
      redirect: 'follow',
      signal: controller.signal,
    })

    const responseText = await upstreamResponse.text()
    const contentType = upstreamResponse.headers.get('content-type') || '(missing)'

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      console.error('[support] Apps Script returned a non-JSON response', {
        status: upstreamResponse.status,
        contentType,
        finalUrl: upstreamResponse.url,
        bodyPreview: responseText.slice(0, 1500),
      })
      return res.status(502).json({
        success: false,
        error: 'Google Apps Script did not return JSON. Check the deployment URL, access permissions, and deployed script version.',
      })
    }

    if (!upstreamResponse.ok || result?.success !== true) {
      console.error('[support] Apps Script reported a failure', {
        status: upstreamResponse.status,
        action,
        error: result?.error || result?.message || 'Unknown Apps Script error',
      })
      return res.status(502).json({
        success: false,
        error: result?.error || result?.message || 'Google Sheets could not save the enquiry.',
      })
    }

    console.log('[support] Scrap enquiry saved successfully')
    return res.status(200).json({
      success: true,
      message: 'Your enquiry has been submitted successfully.',
    })
  } catch (error) {
    const timedOut = error?.name === 'AbortError'
    console.error('[support] Apps Script network request failed:', {
      name: error?.name,
      message: error?.message,
      cause: error?.cause?.message,
    })

    return res.status(timedOut ? 504 : 502).json({
      success: false,
      error: timedOut
        ? 'Google Sheets took too long to respond. Please try again.'
        : 'The server could not connect to Google Sheets. Check the server network and Apps Script URL.',
    })
  } finally {
    clearTimeout(timeout)
  }
})

export default router
