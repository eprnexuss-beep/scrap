// Turn Mongo documents into the exact JSON each role is allowed to see.
// RULE: sellerPrice, margin, pickupArea and seller identity never appear in anything meant for buyers.
import { fallbackImage } from './images.js'
import { agreedLedger, proposedLedger } from './ledger.js'

export const fileDto = (f) => ({
  id: String(f._id),
  filename: f.filename,
  mime: f.mime,
  size: f.size,
  url: `/api/files/${f._id}`,
  buyerVisible: !!f.buyerVisible,
})

const cover = (l) => (l.images?.[0] ? `/api/files/${l.images[0]._id ?? l.images[0]}` : fallbackImage(l.category))

/** Seller (owner) and admin view — includes private pricing. `images`/`documents` must be populated. */
export function listingFull(l, extra = {}) {
  return {
    id: String(l._id),
    ref: l.ref,
    status: l.status,
    category: l.category,
    title: l.title,
    description: l.description,
    condition: l.condition,
    qualityGrade: l.qualityGrade,
    quantity: l.quantity,
    unit: l.unit,
    sellerPrice: l.sellerPrice,
    pricingNotes: l.pricingNotes,
    marginType: l.marginType,
    marginValue: l.marginValue,
    buyerPrice: l.buyerPrice,
    city: l.city,
    state: l.state,
    pickupArea: l.pickupArea,
    fulfilment: l.fulfilment,
    loadingNotes: l.loadingNotes,
    rejectionReason: l.rejectionReason,
    reservedQuantity: l.reservedQuantity,
    offerWindowEndsAt: l.offerWindowEndsAt,
    approvedAt: l.approvedAt,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
    cover: cover(l),
    images: (l.images ?? []).filter((f) => f?.filename).map(fileDto),
    documents: (l.documents ?? []).filter((f) => f?.filename).map(fileDto),
    ...extra,
  }
}

/** Compact row for the seller's table. */
export function listingRow(l, enquiries = 0) {
  return {
    id: String(l._id),
    ref: l.ref,
    status: l.status,
    category: l.category,
    title: l.title,
    quantity: l.quantity,
    unit: l.unit,
    sellerPrice: l.sellerPrice,
    city: l.city,
    state: l.state,
    cover: cover(l),
    enquiries,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }
}

const DAY = 864e5

/**
 * Buyer-facing view of a listing. NEVER include: sellerPrice, margin*, pickupArea, loadingNotes,
 * pricingNotes, seller, unapproved documents.
 */
export function listingForBuyer(l, { saved = false } = {}) {
  const isNew = l.approvedAt && Date.now() - new Date(l.approvedAt).getTime() < 3 * DAY
  const left = l.offerWindowEndsAt ? new Date(l.offerWindowEndsAt).getTime() - Date.now() : null
  return {
    id: String(l._id),
    ref: l.ref,
    category: l.category,
    title: l.title,
    description: l.description,
    condition: l.condition,
    qualityGrade: l.qualityGrade,
    available: Math.max(0, (l.quantity ?? 0) - (l.reservedQuantity ?? 0)),
    unit: l.unit,
    buyerPrice: l.buyerPrice,
    city: l.city,
    state: l.state,
    fulfilment: l.fulfilment,
    status: l.status,
    badge: isNew ? 'New lot' : 'Verified',
    approvedAt: l.approvedAt,
    offerWindowEndsAt: l.offerWindowEndsAt,
    daysLeft: left == null ? null : Math.max(0, Math.ceil(left / DAY)),
    cover: cover(l),
    images: (l.images ?? []).filter((f) => f?.filename).map((f) => ({ id: String(f._id), url: `/api/files/${f._id}` })),
    documents: (l.documents ?? [])
      .filter((f) => f?.filename && f.buyerVisible)
      .map((f) => ({ id: String(f._id), filename: f.filename, size: f.size, mime: f.mime, url: `/api/files/${f._id}` })),
    saved,
  }
}

/** Buyer's own view of their negotiation. Internal notes and seller details are never included. */
export function dealForBuyer(d) {
  const last = d.rounds?.[d.rounds.length - 1]
  return {
    id: String(d._id),
    offerRef: d.offerRef,
    ref: ['under_review', 'counteroffer', 'rejected', 'withdrawn', 'expired'].includes(d.status) ? null : d.ref,
    status: d.status,
    unit: d.unit,
    validUntil: d.validUntil,
    listing: d.listing && d.listing._id
      ? { id: String(d.listing._id), title: d.listing.title, category: d.listing.category, city: d.listing.city, state: d.listing.state, cover: cover(d.listing), buyerPrice: d.listing.buyerPrice }
      : null,
    rounds: (d.rounds ?? []).map((r) => ({ id: String(r._id), by: r.by, pricePerUnit: r.pricePerUnit, quantity: r.quantity, note: r.note, at: r.at })),
    latest: last ? { by: last.by, pricePerUnit: last.pricePerUnit, quantity: last.quantity, at: last.at } : null,
    agreed: d.agreed?.pricePerUnit != null ? { pricePerUnit: d.agreed.pricePerUnit, quantity: d.agreed.quantity, at: d.agreed.at } : null,
    timeline: (d.timeline ?? []).map((t) => ({ key: t.key, at: t.at, note: t.note })),
    payment: d.agreed?.pricePerUnit != null
      ? {
          amount: Math.round(d.agreed.pricePerUnit * (d.finalQuantity ?? d.agreed.quantity)),
          status: d.buyerPayment?.status ?? 'pending',
          reference: d.buyerPayment?.reference ?? '',
          confirmedAt: d.buyerPayment?.confirmedAt ?? null,
          proofUploaded: !!d.buyerPayment?.proof,
        }
      : null,
    // The pickup address is revealed only once the deal reaches the pickup stage.
    pickup: ['pickup_scheduled', 'delivered', 'settled'].includes(d.status)
      ? { scheduledFor: d.pickup?.scheduledFor ?? null, notes: d.pickup?.notes ?? '', location: [d.listing?.pickupArea, d.listing?.city, d.listing?.state].filter(Boolean).join(', ') }
      : null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

const person = (u) => (u && u._id ? { id: String(u._id), companyName: u.companyName, contactPerson: u.contactPerson, email: u.email, phone: u.phone ?? '', city: u.city ?? '', verificationStatus: u.verificationStatus, categories: u.categories ?? [] } : null)

/** Full admin view of a deal. Expects listing, seller, buyer populated (and timeline/notes users optional). */
export function dealForAdmin(d, { documents = [], competing = 0 } = {}) {
  const listing = d.listing
  const agreed = d.agreed?.pricePerUnit != null
  const lastBuyer = [...(d.rounds ?? [])].reverse().find((r) => r.by === 'buyer')
  return {
    id: String(d._id),
    ref: d.ref,
    offerRef: d.offerRef,
    status: d.status,
    unit: d.unit,
    validUntil: d.validUntil,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    listing: listing && listing._id
      ? { id: String(listing._id), ref: listing.ref, title: listing.title, category: listing.category, city: listing.city, state: listing.state, sellerPrice: listing.sellerPrice, buyerPrice: listing.buyerPrice, quantity: listing.quantity, reservedQuantity: listing.reservedQuantity, cover: cover(listing), status: listing.status }
      : null,
    seller: person(d.seller),
    buyer: person(d.buyer),
    rounds: (d.rounds ?? []).map((r) => ({ id: String(r._id), by: r.by, pricePerUnit: r.pricePerUnit, quantity: r.quantity, note: r.note, at: r.at })),
    agreed: agreed ? { pricePerUnit: d.agreed.pricePerUnit, quantity: d.agreed.quantity, at: d.agreed.at } : null,
    finalQuantity: d.finalQuantity,
    sellerPriceSnapshot: d.sellerPriceSnapshot ?? null,
    listedBuyerPriceSnapshot: d.listedBuyerPriceSnapshot ?? null,
    timeline: (d.timeline ?? []).map((t) => ({ key: t.key, at: t.at, note: t.note })),
    internalNotes: (d.internalNotes ?? []).map((n) => ({ id: String(n._id), text: n.text, at: n.at, by: n.by?.companyName ?? 'Admin' })),
    pickup: { scheduledFor: d.pickup?.scheduledFor ?? null, notes: d.pickup?.notes ?? '' },
    buyerPayment: payment(d.buyerPayment),
    sellerPayout: payment(d.sellerPayout),
    ledger: agreed ? { ...agreedLedger(d), kind: 'agreed' } : { ...proposedLedger(listing?.sellerPrice, lastBuyer), kind: 'proposed' },
    competingOffers: competing,
    documents: documents.map(fileDto),
  }
}

const payment = (p) => ({
  status: p?.status ?? 'pending',
  amount: p?.amount ?? 0,
  reference: p?.reference ?? '',
  confirmedAt: p?.confirmedAt ?? null,
  hasProof: !!p?.proof,
  proofUrl: p?.proof ? `/api/files/${p.proof._id ?? p.proof}` : null,
})

/** Seller: no buyer identity, no buyer price, no margin — only what they will be paid. */
export function dealForSeller(d) {
  const qty = d.finalQuantity ?? d.agreed?.quantity ?? 0
  return {
    id: String(d._id),
    ref: d.ref,
    status: d.status,
    unit: d.unit,
    listing: d.listing && d.listing._id ? { id: String(d.listing._id), ref: d.listing.ref, title: d.listing.title, category: d.listing.category, cover: cover(d.listing) } : null,
    quantity: qty,
    sellerAmount: Math.round((d.sellerPriceSnapshot ?? 0) * qty),
    timeline: (d.timeline ?? []).map((t) => ({ key: t.key, at: t.at })),
    pickupScheduledFor: d.pickup?.scheduledFor ?? null,
    payout: { status: d.sellerPayout?.status ?? 'pending', reference: d.sellerPayout?.reference ?? '', confirmedAt: d.sellerPayout?.confirmedAt ?? null },
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}
