// Pricing maths shared by server and client so the admin preview always equals what is stored.
export function marginAmount(sellerPrice, marginType, marginValue) {
  const base = Number(sellerPrice) || 0
  const value = Number(marginValue) || 0
  return marginType === 'percentage' ? Math.round((base * value) / 100) : Math.round(value)
}

export function buyerPriceFor(sellerPrice, marginType, marginValue) {
  return Math.round((Number(sellerPrice) || 0) + marginAmount(sellerPrice, marginType, marginValue))
}
