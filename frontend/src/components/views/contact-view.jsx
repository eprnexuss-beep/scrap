
import { useState } from 'react'
import {
  Mail, Phone, MapPin, MessageSquare, Send, CheckCircle2,
} from 'lucide-react'
import { useAppNav } from '@/hooks/use-app-nav'
import { PublicHeader } from '@/components/layout/public-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { api } from '@/lib/api'

const buyerIssues = [
  'Buying scrap material',
  'Credit or listing enquiry',
  'Payment related issue',
  'Order or deal status',
  'Document related issue',
  'Other',
]

const sellerIssues = [
  'Listing my scrap material',
  'Seller verification',
  'Listing approval',
  'Payment or settlement',
  'Document related issue',
  'Other',
]

const initialForm = {
  name: '',
  phone: '',
  email: '',
  role: '',
  issue: '',
  query: '',
}

export function ContactView() {
  const go = useAppNav()
  const [form, setForm] = useState(initialForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const update = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'role' ? { issue: '', query: '' } : {}),
    }))
    setError('')
    setSuccess(false)
  }

  const issues = form.role === 'Buyer'
    ? buyerIssues
    : form.role === 'Seller'
      ? sellerIssues
      : []

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess(false)

    if (!form.role || !form.issue) {
      setError('Please select your role and enquiry category.')
      return
    }

    if (form.issue === 'Other' && !form.query.trim()) {
      setError('Please describe your query when selecting Other.')
      return
    }

    setBusy(true)

    try {
      await api('/api/support', {
        method: 'POST',
        json: {
          action: 'scrap_support',
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          type: form.role,
          issue: form.issue,
          manualQuery: form.query.trim(),
        },
      })

      setSuccess(true)
      setForm(initialForm)
    } catch (err) {
      setError(err.message || 'Unable to submit your enquiry. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7f9]">
      <PublicHeader go={go} />

      <main className="mx-auto w-full max-w-[1250px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        <div className="mb-7 text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-green-600">
            WE ARE HERE TO HELP
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#14212b] sm:text-3xl">
            Contact EPR Nexuss
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Have a question? Get in touch with our support team.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">

          {/* LEFT: Contact Information */}
          <div className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <Mail size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400">
                  EMAIL US
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-slate-900">
                  info@eprnexuss.com
                </h3>
                <div className="mt-1.5 flex flex-col gap-1 text-xs text-slate-500">
                  <a href="mailto:info@eprnexuss.com" className="hover:text-green-600">
                    info@eprnexuss.com
                  </a>
                  <a href="mailto:eprnexuss@gmail.com" className="hover:text-green-600">
                    eprnexuss@gmail.com
                  </a>
                </div>
                <a
                  href="mailto:info@eprnexuss.com"
                  className="mt-3 inline-flex rounded-md bg-green-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-green-700"
                >
                  Email support
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <Phone size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400">
                  CALL US
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-slate-900">
                  +91 9220386699
                </h3>
                <div className="mt-1.5 flex flex-col gap-1 text-xs text-slate-500">
                  <a href="tel:+919220386699" className="hover:text-green-600">
                    +91 9220386699
                  </a>
                  <a href="tel:01204605014" className="hover:text-green-600">
                    0120-4605014
                  </a>
                </div>
                <a
                  href="tel:+919220386699"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-green-700"
                >
                  <Phone size={12} /> Call for instant solution
                </a>
              </div>
            </div>

            {/* Office */}
            <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <MapPin size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400">
                  VISIT US
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-slate-900">
                  EPR Nexuss
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  H 161, Office, BSI Business Park, 09, Sector 63 Rd,
                  H Block, Sector 63, Noida, Uttar Pradesh 201301
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Mon–Sat, 10:00am–6:00pm
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Support Form */}
          <div className="rounded-xl bg-[#12212b] p-5 text-white shadow-xl sm:p-6">

            <div className="mb-5">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-green-400">
                <MessageSquare size={18} />
              </div>

              <p className="text-[9px] font-bold tracking-[0.16em] text-slate-400">
                SUPPORT REQUEST
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Facing an issue?
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Tell us what you need help with and our support team will get back to you shortly.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-3.5">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-300">
                    Name *
                  </span>
                  <input
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Your full name"
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-300">
                    Phone number *
                  </span>
                  <input
                    required
                    type="tel"
                    maxLength={20}
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-300">
                  Email *
                </span>
                <input
                  required
                  type="email"
                  maxLength={160}
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@company.com"
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-[11px] font-semibold text-slate-300">
                  Who are you? *
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {['Buyer', 'Seller'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => update('role', role)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        form.role === role
                          ? 'border-green-500 bg-green-600 text-white'
                          : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-300">
                  What can we help with? *
                </span>
                <select
                  required
                  value={form.issue}
                  onChange={(e) => update('issue', e.target.value)}
                  disabled={!form.role}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-green-500 disabled:bg-slate-200"
                >
                  <option value="">
                    {form.role ? 'Select an enquiry category' : 'Select Buyer or Seller first'}
                  </option>
                  {issues.map((issue) => (
                    <option key={issue} value={issue}>{issue}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-300">
                  Tell us more <span className="font-normal text-slate-500">(optional unless you choose Other)</span>
                </span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  required={form.issue === 'Other'}
                  value={form.query}
                  onChange={(e) => update('query', e.target.value)}
                  placeholder="Write your query here..."
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </label>

              {error && (
                <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              {success && (
                <p role="status" className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">
                  <CheckCircle2 size={15} />
                  Your enquiry has been submitted successfully.
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-500 text-xs font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Submitting...' : 'Send enquiry'}
                {!busy && <Send size={13} />}
              </button>

            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
