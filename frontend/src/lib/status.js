import { LISTING_STATUS_LABEL } from '@/lib/constants'

export const LISTING_TONE = {
  draft: 'gray',
  pending: 'amber',
  active: 'green',
  negotiation: 'amber',
  rejected: 'red',
  sold: 'blue',
  closed: 'gray',
}

export const listingBadge = (status) => ({
  label: LISTING_STATUS_LABEL[status] ?? status,
  tone: LISTING_TONE[status] ?? 'gray',
})

export const DEAL_STATUS_LABEL = {
  under_review: 'Under review',
  counteroffer: 'Counteroffer',
  terms_agreed: 'Terms agreed',
  inspection: 'Inspection',
  pickup_scheduled: 'Pickup scheduled',
  delivered: 'Delivered',
  settled: 'Settled',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

export const DEAL_TONE = {
  under_review: 'amber',
  counteroffer: 'amber',
  terms_agreed: 'blue',
  inspection: 'blue',
  pickup_scheduled: 'blue',
  delivered: 'blue',
  settled: 'green',
  rejected: 'red',
  withdrawn: 'gray',
  cancelled: 'gray',
  expired: 'gray',
}

// Admin-facing wording: a deal with more than one round is "under negotiation".
export function adminDealLabel(d) {
  if (d.status === 'under_review') return d.rounds?.length > 1 || d.rounds === undefined ? 'Under negotiation' : 'Awaiting decision'
  if (d.status === 'counteroffer') return 'Counteroffer sent'
  return DEAL_STATUS_LABEL[d.status] ?? d.status
}
