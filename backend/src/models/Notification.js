import mongoose from 'mongoose'

const { Schema } = mongoose

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'info' },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, default: '', maxlength: 1000 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

NotificationSchema.index({ user: 1, createdAt: -1 })

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)

// Fire-and-forget helper. Never lets a notification failure break the main action.
export async function notify(userIds, { type = 'info', title, body = '', link = '' }) {
  try {
    const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean).map(String))]
    if (!ids.length) return
    await Notification.insertMany(ids.map((user) => ({ user, type, title, body, link })))
  } catch (error) {
    console.error('[notify] failed:', error.message)
  }
}
