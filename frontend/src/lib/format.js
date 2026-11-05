const inr = new Intl.NumberFormat('en-IN')

export const formatNumber = (n) => inr.format(Number(n ?? 0))

export const formatINR = (n) => `₹${inr.format(Math.round(Number(n ?? 0)))}`

/** ₹45,000/MT */
export const formatPrice = (n, unit = 'MT') => `${formatINR(n)}/${unit}`

/** ₹12.5L / ₹8.4Cr style for big totals */
export function formatCompactINR(n) {
  const v = Number(n ?? 0)
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(1).replace(/\.0$/, '')}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1).replace(/\.0$/, '')}L`
  return formatINR(v)
}

export const formatQty = (qty, unit = 'MT') => `${formatNumber(qty)} ${unit}`

export function formatDate(value, withTime = false) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export function timeAgo(value) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  const steps = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
  ]
  let n = seconds
  let unit = 'second'
  for (const [size, name] of steps) {
    unit = name
    if (n < size) break
    n = Math.floor(n / size)
    unit = name === 'month' ? 'year' : unit
  }
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
