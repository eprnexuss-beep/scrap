import mongoose from 'mongoose'

const CounterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
})

export const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema)

// Atomic, gap-free-ish sequence used for human-readable references (ENX-L-24081, OFR-2518 ...).
export async function nextSeq(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )
  return doc.seq
}
