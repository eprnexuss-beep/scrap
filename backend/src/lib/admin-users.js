import { fileDto } from './serializers.js'

export const userRow = (u) => ({
  id: String(u._id),
  role: u.role,
  companyName: u.companyName,
  contactPerson: u.contactPerson,
  email: u.email,
  phone: u.phone ?? '',
  city: u.city ?? '',
  gstin: u.gstin ?? '',
  categories: u.categories ?? [],
  verificationStatus: u.verificationStatus,
  createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt,
  documentCount: u.documents?.length ?? 0,
})

export const userDetail = (u) => ({
  ...userRow(u),
  businessType: u.businessType ?? '',
  yearsInOperation: u.yearsInOperation ?? '',
  verificationNote: u.verificationNote ?? '',
  verifiedAt: u.verifiedAt,
  documents: (u.documents ?? []).filter((d) => d?.filename).map(fileDto),
})

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
