import mongoose from 'mongoose'

const { Schema } = mongoose

const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorRole: { type: String, default: '' },
    action: { type: String, required: true, index: true }, // e.g. "user.verify"
    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },
    summary: { type: String, default: '' },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

AuditLogSchema.index({ createdAt: -1 })

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema)

export async function audit({ actor, action, entityType = '', entityId = '', summary = '', meta = {}, ip = '' }) {
  try {
    await AuditLog.create({
      actor: actor?._id ?? actor?.id ?? null,
      actorRole: actor?.role ?? '',
      action,
      entityType,
      entityId: String(entityId ?? ''),
      summary,
      meta,
      ip,
    })
  } catch (error) {
    console.error('[audit] failed:', error.message)
  }
}
