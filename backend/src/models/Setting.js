import mongoose from 'mongoose'

const SettingSchema = new mongoose.Schema(
  { _id: String, value: mongoose.Schema.Types.Mixed },
  { timestamps: true },
)

export const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema)

export const DEFAULT_PRICING = {
  defaultMarginType: 'fixed', // 'fixed' (₹/unit) or 'percentage'
  defaultMarginValue: 2500,
  offerWindowDays: 7,
}

export async function getPricingSettings() {
  const doc = await Setting.findById('pricing').lean()
  return { ...DEFAULT_PRICING, ...(doc?.value ?? {}) }
}
