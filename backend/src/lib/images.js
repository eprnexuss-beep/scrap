// Placeholder photo used when a listing has no uploaded images yet.
const BY_CATEGORY = {
  'E-Waste': '/assets/metal-scrap.jpg',
  Metals: '/assets/aluminium-scrap.jpg',
}
export const fallbackImage = (category) => BY_CATEGORY[category] ?? '/assets/recycling-facility.jpg'
