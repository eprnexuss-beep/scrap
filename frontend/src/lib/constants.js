// Shared constants — safe to import from both server and client code.

export const ROLES = ['seller', 'buyer', 'admin']

export const CATEGORIES = ['E-Waste', 'Plastic', 'Metals', 'Batteries', 'Rubber & Tyres', 'Other']

export const UNITS = ['MT', 'KG', 'Units']

export const CONDITIONS = ['Used', 'Processed', 'Baled', 'Mixed']

export const QUALITY_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Ungraded']

export const FULFILMENT_OPTIONS = ['Buyer pickup', 'Seller delivery', 'Negotiable']

export const SESSION_COOKIE = 'enx_session'

export const MAX_FILE_MB = 10
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

export const ROLE_HOME = {
  seller: '/seller',
  buyer: '/buyer',
  admin: '/admin-dashboard',
}

export const VERIFICATION_LABEL = {
  pending: 'Under review',
  approved: 'Verified',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export const LISTING_STATUS_LABEL = {
  draft: 'Draft',
  pending: 'Pending approval',
  active: 'Active',
  negotiation: 'Negotiation',
  rejected: 'Rejected',
  sold: 'Sold',
  closed: 'Closed',
}

// Order matters: this is the fulfilment timeline shown in the deal screen.
export const DEAL_STAGES = [
  { key: 'offer_submitted', label: 'Offer submitted' },
  { key: 'negotiation', label: 'Under negotiation' },
  { key: 'terms_agreed', label: 'Terms agreed' },
  { key: 'inspection', label: 'Inspection / weighment' },
  { key: 'pickup_scheduled', label: 'Pickup scheduled' },
  { key: 'delivered', label: 'Material delivered' },
  { key: 'settled', label: 'Settlement completed' },
]
