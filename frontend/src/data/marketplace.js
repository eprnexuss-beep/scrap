import { publicAsset } from '@/lib/public-asset'

export const listings = [
  { name: 'E-Waste (Mixed)', category: 'E-Waste', qty: '5 MT', price: '₹47,500/MT', location: 'Delhi NCR', image: publicAsset('assets/metal-scrap.jpg'), status: 'Verified' },
  { name: 'Aluminium Turnings', category: 'Metals', qty: '12 MT', price: '₹84,200/MT', location: 'Pune, MH', image: publicAsset('assets/aluminium-scrap.jpg'), status: 'New lot' },
  { name: 'Industrial Machinery', category: 'Metal Scrap', qty: '8 MT', price: '₹62,000/MT', location: 'Ahmedabad, GJ', image: publicAsset('assets/recycling-facility.jpg'), status: 'Verified' },
]

export const sellerRows = [
  ['E-Waste (Mixed)', '5 MT', '₹45,000/MT', 'Active', '8'],
  ['Plastic Scrap (PET)', '10 MT', '₹32,000/MT', 'Negotiation', '12'],
  ['Used Tyres', '2 MT', '₹18,000/MT', 'Pending Approval', '3'],
  ['Aluminium Turnings', '12 MT', '₹80,000/MT', 'Draft', '0'],
]
