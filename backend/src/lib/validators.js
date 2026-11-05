import { z } from 'zod'
import { CATEGORIES } from '../config/constants.js'

export const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(100, 'Password is too long.')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Password must include at least one letter and one number.')

// Canonical form: digits only; Indian numbers lose the +91 / 91 / 0 prefix so "+91 98765 43210" and "9876543210" match.
export function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

const phone = z
  .string()
  .trim()
  .refine((v) => /^\+?[\d\s\-()]{10,18}$/.test(v) && normalizePhone(v).length >= 10 && normalizePhone(v).length <= 13,
    'Enter a valid phone number, e.g. +91 98765 43210.')
  .transform(normalizePhone)

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export const registerSchema = z.object({
  role: z.enum(['seller', 'buyer'], { message: 'Choose Seller or Recycler.' }),
  companyName: z.string().trim().min(2, 'Enter the registered company name.').max(160),
  contactPerson: z.string().trim().min(2, 'Enter the contact person’s name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid business email.'),
  phone,
  password: passwordRule,
  businessType: z.string().trim().min(2, 'Enter your business type.').max(120),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => GSTIN.test(v), 'Enter a valid 15-character GSTIN, e.g. 22AAAAA0000A1Z5.'),
  city: z.string().trim().min(2, 'Enter your registered city.').max(120),
  yearsInOperation: z.string().trim().max(40).optional().default(''),
  categories: z.array(z.enum(CATEGORIES)).default([]),
  acceptTerms: z.literal(true, { message: 'Please accept the platform terms.' }),
})

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number.').max(160),
  password: z.string().min(1, 'Enter your password.').max(100),
  role: z.enum(['seller', 'buyer', 'admin']),
  remember: z.boolean().optional().default(false),
})

