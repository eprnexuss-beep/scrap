import mongoose from 'mongoose'
import '../models/index.js' // register all models

// Cache the connection on globalThis so dev hot-reloads / serverless
// invocations re-use one connection instead of opening a new one each time.
const cache = (globalThis._enxMongoose ??= { conn: null, promise: null })

export async function connectDB() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.')
  }
  if (uri.includes('<db_username>') || uri.includes('<db_password>')) {
    throw new Error(
      'MONGODB_URI still contains the <db_username> placeholder. Put your real Atlas database username in .env.local.',
    )
  }

  if (cache.conn) return cache.conn

  cache.promise ??= mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  })

  try {
    cache.conn = await cache.promise
  } catch (error) {
    cache.promise = null
    throw error
  }
  return cache.conn
}
