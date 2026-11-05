import nodemailer from 'nodemailer'

let transport = null

function getTransport() {
  if (transport) return transport
  if (!process.env.SMTP_HOST) return null
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
  return transport
}

/** Sends an email through SMTP when SMTP_* env vars are set; otherwise prints it to the server console (dev). */
export async function sendMail({ to, subject, text }) {
  const t = getTransport()
  if (!t) {
    console.log(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n[mail:dev] ${text}\n`)
    return { sent: false }
  }
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.EMAIL_FROM || 'EPR Nexuss <no-reply@eprnexuss.com>', to, subject, text })
  return { sent: true }
}

export const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
