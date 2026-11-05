import 'dotenv/config'
import { createApp } from './app.js'
import { connectDB } from './lib/db.js'

const port = Number(process.env.PORT || 4000)
const app = createApp()

// Connect once at boot so a bad MONGODB_URI is reported immediately (requests also lazily reconnect).
connectDB()
  .then(() => console.log('✔ MongoDB connected'))
  .catch((e) => console.error(`✖ MongoDB connection failed: ${e.message}`))

app.listen(port, () => console.log(`✔ EPR Nexuss API listening on http://localhost:${port}`))
