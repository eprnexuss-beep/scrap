import mongoose from 'mongoose'
import { CATEGORIES } from '../config/constants.js'

const { Schema } = mongoose

const ListingSchema = new Schema(
  {
    ref: { type: String, required: true, unique: true }, // e.g. ENX-L-24081
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Step 1 — scrap details
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 4000, default: '' },
    condition: { type: String, trim: true, maxlength: 60, default: '' },
    qualityGrade: { type: String, trim: true, maxlength: 60, default: '' },

    // Step 2 — quantity & price. sellerPrice is PRIVATE: never sent to buyers.
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'MT' },
    sellerPrice: { type: Number, required: true, min: 0 },
    pricingNotes: { type: String, trim: true, maxlength: 1000, default: '' },

    // Set by admin. buyerPrice = sellerPrice + margin, stored so it can be sorted/filtered.
    marginType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    marginValue: { type: Number, default: 0, min: 0 },
    buyerPrice: { type: Number, default: null },

    // Step 3 — location. pickupArea / loadingNotes stay private until the deal stage.
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pickupArea: { type: String, trim: true, default: '' },
    fulfilment: { type: String, trim: true, default: 'Buyer pickup' },
    loadingNotes: { type: String, trim: true, maxlength: 1000, default: '' },

    // Step 4 — files
    images: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    documents: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],

    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'negotiation', 'rejected', 'sold', 'closed'],
      default: 'draft',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    offerWindowEndsAt: { type: Date, default: null },

    // Quantity currently held by accepted deals.
    reservedQuantity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

ListingSchema.index({ status: 1, category: 1, createdAt: -1 })
ListingSchema.index({ title: 'text', description: 'text', category: 'text' })

export const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema)
