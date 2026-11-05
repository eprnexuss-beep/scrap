import { z } from 'zod'
import { CATEGORIES, UNITS } from '../config/constants.js'

const FIELDS = [
  'category', 'title', 'description', 'condition', 'qualityGrade',
  'quantity', 'unit', 'sellerPrice', 'pricingNotes',
  'city', 'state', 'pickupArea', 'fulfilment', 'loadingNotes',
]

const text = (max) => z.string().trim().max(max, `Keep this under ${max} characters.`).default('')

const positive = (message) =>
  z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/,/g, '')))
    .refine((n) => Number.isFinite(n) && n > 0, message)

const blankOrNumber = z
  .string()
  .trim()
  .transform((v) => (v === '' ? 0 : Number(v.replace(/,/g, ''))))
  .refine((n) => Number.isFinite(n) && n >= 0, 'Enter a valid number.')

const shared = {
  description: text(4000),
  condition: text(60),
  qualityGrade: text(60),
  unit: z.enum(UNITS, { message: 'Choose a unit.' }).default('MT'),
  pricingNotes: text(1000),
  pickupArea: text(160),
  fulfilment: text(60),
  loadingNotes: text(1000),
}

// Submitting for approval: everything the admin needs must be present.
export const submitSchema = z.object({
  ...shared,
  category: z.enum(CATEGORIES, { message: 'Choose a scrap category.' }),
  title: z.string().trim().min(3, 'Enter the material type and grade (e.g. Mixed E-Waste, Grade A).').max(160),
  quantity: positive('Enter the available quantity (greater than 0).'),
  sellerPrice: positive('Enter your expected / minimum price (greater than 0).'),
  city: z.string().trim().min(2, 'Enter the city.').max(120),
  state: z.string().trim().min(2, 'Enter the state.').max(120),
})

// Saving a draft: only a category and a title are needed to keep the work.
export const draftSchema = z.object({
  ...shared,
  category: z.enum(CATEGORIES, { message: 'Choose a scrap category to save a draft.' }),
  title: z.string().trim().min(3, 'Enter a material name to save a draft.').max(160),
  quantity: blankOrNumber,
  sellerPrice: blankOrNumber,
  city: text(120),
  state: text(120),
})

export function parseListingForm(form, intent) {
  const raw = Object.fromEntries(FIELDS.map((k) => [k, String(form.get(k) ?? '')]))
  // A blank unit means "use the default" rather than "invalid".
  if (!raw.unit.trim()) delete raw.unit
  return (intent === 'submit' ? submitSchema : draftSchema).parse(raw)
}

export const MAX_IMAGES = 8
export const MAX_DOCUMENTS = 5
