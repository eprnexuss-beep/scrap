// One place for deal money maths (client + server). All amounts are in ₹.
export const quantityOf = (deal) => deal.finalQuantity ?? deal.agreed?.quantity ?? 0

/**
 * Settled/agreed ledger — always computed from the snapshots taken when terms were agreed:
 *   seller is paid  sellerPriceSnapshot × quantity   (deal-specific negotiated seller settlement)
 *   buyer pays      agreed price × quantity
 *   platform keeps  the difference
 */
export function agreedLedger(deal) {
  const qty = quantityOf(deal)
  const sellerAmount = Math.round((deal.sellerPriceSnapshot ?? 0) * qty)
  const buyerAmount = Math.round((deal.agreed?.pricePerUnit ?? 0) * qty)
  return { quantity: qty, sellerAmount, buyerAmount, revenue: buyerAmount - sellerAmount }
}

/** Projection while still negotiating: latest buyer proposal vs the seller's current private price. */
export function proposedLedger(sellerPrice, round) {
  if (!round) return { quantity: 0, sellerAmount: 0, buyerAmount: 0, revenue: 0 }
  const sellerAmount = Math.round((sellerPrice ?? 0) * round.quantity)
  const buyerAmount = Math.round(round.pricePerUnit * round.quantity)
  return { quantity: round.quantity, sellerAmount, buyerAmount, revenue: buyerAmount - sellerAmount }
}

export const STAGE_ORDER = ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered', 'settled']
export const NEXT_STAGE = Object.fromEntries(STAGE_ORDER.slice(0, -1).map((s, i) => [s, STAGE_ORDER[i + 1]]))
export const LIVE_STATUSES = ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered']
export const OPEN_NEGOTIATION = ['under_review', 'counteroffer']
export const CLOSED_STATUSES = ['rejected', 'withdrawn', 'cancelled', 'expired']
