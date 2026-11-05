import mongoose from 'mongoose'

const { Schema } = mongoose

const UserSchema = new Schema(
  {
    role: { type: String, enum: ['seller', 'buyer', 'admin'], required: true, index: true },

    companyName: { type: String, required: true, trim: true, maxlength: 160 },
    contactPerson: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String, required: true, select: false },
    passwordChangedAt: { type: Date, default: null },

    businessType: { type: String, trim: true, maxlength: 120 },
    gstin: { type: String, trim: true, uppercase: true },
    city: { type: String, trim: true, maxlength: 120 },
    yearsInOperation: { type: String, trim: true, maxlength: 40 },
    // Buyer only: categories the recycler claims authorisation for. Admin confirms these on verification.
    categories: { type: [String], default: [] },

    documents: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],

    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    verificationNote: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    savedListings: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],

    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
)

UserSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    role: this.role,
    companyName: this.companyName,
    contactPerson: this.contactPerson,
    email: this.email,
    phone: this.phone ?? '',
    businessType: this.businessType ?? '',
    gstin: this.gstin ?? '',
    city: this.city ?? '',
    yearsInOperation: this.yearsInOperation ?? '',
    categories: this.categories ?? [],
    verificationStatus: this.verificationStatus,
    verificationNote: this.verificationNote ?? '',
    verifiedAt: this.verifiedAt,
    createdAt: this.createdAt,
  }
}

export const User = mongoose.models.User || mongoose.model('User', UserSchema)
