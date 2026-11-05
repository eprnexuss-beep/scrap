import mongoose from 'mongoose'

const { Schema } = mongoose

const RoundSchema = new Schema(
  {
    by: { type: String, enum: ['buyer', 'admin'], required: true },
    byUser: { type: Schema.Types.ObjectId, ref: 'User' },
    pricePerUnit: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    note: { type: String, default: '', maxlength: 1000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true },
)

const TimelineSchema = new Schema(
  {
    key: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
  },
  { _id: false },
)

const PaymentSchema = new Schema(
  {
    status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
    amount: { type: Number, default: 0 },
    reference: { type: String, default: '' },
    confirmedAt: { type: Date, default: null },
    proof: { type: Schema.Types.ObjectId, ref: 'FileAsset', default: null },
  },
  { _id: false },
)

// One document = one buyer's negotiation on one listing, which becomes the fulfilment record once terms are agreed.
const DealSchema = new Schema(
  {
    ref: { type: String, required: true, unique: true }, // ENX2025-0001
    offerRef: { type: String, required: true, unique: true }, // OFR-2518 (what the buyer sees first)
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    unit: { type: String, default: 'MT' },
    validUntil: { type: Date, default: null },

    rounds: [RoundSchema],

    status: {
      type: String,
      enum: [
        'under_review', // buyer's turn is done, admin must act
        'counteroffer', // admin countered, buyer must act
        'terms_agreed',
        'inspection',
        'pickup_scheduled',
        'delivered',
        'settled',
        'rejected',
        'withdrawn',
        'cancelled',
        'expired',
      ],
      default: 'under_review',
      index: true,
    },

    // Snapshots taken when terms are agreed — the ledger is always calculated from these.
    agreed: {
      pricePerUnit: { type: Number, default: null },
      quantity: { type: Number, default: null },
      at: { type: Date, default: null },
    },
    sellerPriceSnapshot: { type: Number, default: null },
    listedBuyerPriceSnapshot: { type: Number, default: null },
    // Final weighed quantity (can differ from agreed quantity).
    finalQuantity: { type: Number, default: null },

    timeline: [TimelineSchema],
    internalNotes: [
      {
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, maxlength: 2000 },
        at: { type: Date, default: Date.now },
      },
    ],

    pickup: {
      scheduledFor: { type: Date, default: null },
      notes: { type: String, default: '' },
    },

    buyerPayment: { type: PaymentSchema, default: () => ({}) },
    sellerPayout: { type: PaymentSchema, default: () => ({}) },
  },
  { timestamps: true },
)

DealSchema.index({ listing: 1, buyer: 1 })

export const Deal = mongoose.models.Deal || mongoose.model('Deal', DealSchema)
