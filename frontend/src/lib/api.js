// Tiny fetch wrapper used by every screen. Throws ApiClientError with a human-readable message.
export class ApiClientError extends Error {
  constructor(message, status, field) {
    super(message)
    this.status = status
    this.field = field
  }
}

/**
 * api('/api/x')                              → GET
 * api('/api/x', { method:'POST', json:{} })  → JSON body
 * api('/api/x', { method:'POST', form })     → multipart FormData (file uploads)
 */
export async function api(path, { method = 'GET', json, form } = {}) {
  let response
  try {
    response = await fetch(path, {
      method,
      headers: json ? { 'Content-Type': 'application/json' } : undefined,
      body: json ? JSON.stringify(json) : form,
      credentials: 'same-origin',
      cache: 'no-store',
    })
  } catch {
    throw new ApiClientError('Network error. Check your connection and try again.', 0)
  }

  let data = null
  try {
    data = await response.json()
  } catch {}

  if (!response.ok) {
    throw new ApiClientError(data?.error || 'Something went wrong. Please try again.', response.status, data?.field)
  }
  return data
}
