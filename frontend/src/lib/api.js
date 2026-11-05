
const API_BASE_URL = import.meta.env.VITE_API_URL

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
 * api('/api/x', { method:'POST', form })     → multipart FormData
 */
export async function api(path, { method = 'GET', json, form } = {}) {
  let response

  const url = API_BASE_URL
    ? new URL(path, API_BASE_URL).toString()
    : path

  try {
    response = await fetch(url, {
      method,
      headers: json
        ? { 'Content-Type': 'application/json' }
        : undefined,
      body: json ? JSON.stringify(json) : form,
      credentials: API_BASE_URL ? 'include' : 'same-origin',
      cache: 'no-store',
    })
  } catch {
    throw new ApiClientError(
      'Network error. Check your connection and try again.',
      0
    )
  }

  let data = null

  try {
    data = await response.json()
  } catch {}

  if (!response.ok) {
    throw new ApiClientError(
      data?.error || 'Something went wrong. Please try again.',
      response.status,
      data?.field
    )
  }

  return data
}
