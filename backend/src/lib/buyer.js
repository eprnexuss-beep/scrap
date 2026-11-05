import { ApiError } from './http.js'

/** A buyer may browse only when approved. Returns the categories they're authorised for. */
export function buyerAccess(user) {
  const verified = user.verificationStatus === 'approved'
  return { verified, categories: verified ? user.categories : [] }
}

export function assertCanTrade(user) {
  if (user.verificationStatus !== 'approved') {
    throw new ApiError(403, 'Your account is still being verified. Offers unlock once EPR Nexuss approves your documents.')
  }
}

/** Mongo filter for lots this buyer may see right now. */
export function visibleListingFilter(user) {
  const { categories } = buyerAccess(user)
  return {
    // A lot stays visible while part of it is reserved by an agreed deal, as long as some quantity remains.
    status: { $in: ['active', 'negotiation'] },
    $expr: { $gt: [{ $subtract: ['$quantity', '$reservedQuantity'] }, 0] },
    category: { $in: categories },
    buyerPrice: { $ne: null },
    $or: [{ offerWindowEndsAt: null }, { offerWindowEndsAt: { $gt: new Date() } }],
  }
}
