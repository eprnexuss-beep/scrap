import mongoose from 'mongoose'

const { Schema } = mongoose

// Metadata for a file whose bytes live in GridFS (bucket "uploads").
const FileAssetSchema = new Schema(
  {
    gridfsId: { type: Schema.Types.ObjectId, required: true },
    filename: { type: String, required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    kind: {
      type: String,
      enum: ['kyc', 'listing-image', 'listing-document', 'deal-document'],
      required: true,
      index: true,
    },
    label: { type: String, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', default: null, index: true },
    deal: { type: Schema.Types.ObjectId, ref: 'Deal', default: null, index: true },
    // Listing documents are private to seller/admin until an admin approves them for buyers.
    buyerVisible: { type: Boolean, default: false },
  },
  { timestamps: true },
)

FileAssetSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    filename: this.filename,
    mime: this.mime,
    size: this.size,
    kind: this.kind,
    label: this.label,
    buyerVisible: this.buyerVisible,
    url: `/api/files/${this._id}`,
    createdAt: this.createdAt,
  }
}

export const FileAsset = mongoose.models.FileAsset || mongoose.model('FileAsset', FileAssetSchema)
