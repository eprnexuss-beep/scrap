/**
 * Build a URL for a file stored in Vite's public directory.
 * Vite's BASE_URL includes the configured deployment subpath (for this app: /scrap/).
 */
export function publicAsset(path) {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${String(path).replace(/^\/+/, '')}`
}
