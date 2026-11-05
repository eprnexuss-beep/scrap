// Creates (or resets) the first admin account.   Usage:  npm run seed:admin
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_COMPANY, ADMIN_PHONE } = process.env

if (!MONGODB_URI || MONGODB_URI.includes('<db_username>')) {
  console.error('✖ Set a real MONGODB_URI (with your Atlas username) in backend/.env first.')
  process.exit(1)
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error('✖ Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars) in backend/.env first.')
  process.exit(1)
}

await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
const users = mongoose.connection.collection('users')
const email = ADMIN_EMAIL.trim().toLowerCase()
const now = new Date()
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

const existing = await users.findOne({ email })
if (existing && existing.role !== 'admin') {
  console.error(`✖ ${email} already belongs to a ${existing.role} account. Use a different ADMIN_EMAIL.`)
  process.exit(1)
}

await users.updateOne(
  { email },
  {
    $set: {
      role: 'admin',
      companyName: ADMIN_COMPANY || 'EPR Nexuss',
      contactPerson: ADMIN_NAME || 'EPR Nexuss Admin',
      email,
      ...(ADMIN_PHONE ? { phone: ADMIN_PHONE.replace(/\D/g, '').replace(/^(91)?(\d{10})$/, '$2') } : {}),
      passwordHash,
      passwordChangedAt: now,
      verificationStatus: 'approved',
      verifiedAt: now,
      updatedAt: now,
    },
    $setOnInsert: { documents: [], categories: [], savedListings: [], verificationNote: '', createdAt: now, __v: 0 },
  },
  { upsert: true },
)

console.log(`✔ Admin ready: ${email}  (${existing ? 'password reset' : 'created'})`)
await mongoose.disconnect()
