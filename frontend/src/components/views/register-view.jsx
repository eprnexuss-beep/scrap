import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Factory, Recycle, ShieldCheck, UploadCloud } from 'lucide-react'
import { useAppNav } from '@/hooks/use-app-nav'
import { AuthShell } from '@/components/layout/auth-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { FilePicker } from '@/components/shared/file-picker'
import { api } from '@/lib/api'
import { CATEGORIES } from '@/lib/constants'

const steps = ['Company details', 'Business information', 'Documents', 'Review & submit']

const EMPTY = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  businessType: '',
  gstin: '',
  city: '',
  yearsInOperation: '',
}

// Which wizard step owns which field (so a server-side error can jump back to the right step).
const FIELD_STEP = {
  companyName: 1, contactPerson: 1, email: 1, phone: 1, password: 1,
  businessType: 2, gstin: 2, city: 2, yearsInOperation: 2, categories: 2,
  documents: 3, acceptTerms: 4,
}

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

function validateStep(step, form, role, categories, files) {
  const e = {}
  if (step === 1) {
    if (form.companyName.trim().length < 2) e.companyName = 'Enter the registered company name.'
    if (form.contactPerson.trim().length < 2) e.contactPerson = 'Enter the contact person’s name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid business email.'
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number.'
    if (form.password.length < 8) e.password = 'Use at least 8 characters.'
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'Include a letter and a number.'
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
  }
  if (step === 2) {
    if (form.businessType.trim().length < 2) e.businessType = 'Enter your business type.'
    if (!GSTIN.test(form.gstin.trim().toUpperCase())) e.gstin = 'Enter a valid 15-character GSTIN.'
    if (form.city.trim().length < 2) e.city = 'Enter your registered city.'
    if (role === 'buyer' && categories.length === 0) e.categories = 'Select at least one authorised category.'
  }
  if (step === 3 && files.length === 0) e.documents = 'Upload at least one verification document.'
  return e
}

export function RegisterView() {
  const go = useAppNav()
  const [role, setRole] = useState(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [files, setFiles] = useState([])
  const [accepted, setAccepted] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const toggleCategory = (item) => {
    setErrors((e) => ({ ...e, categories: undefined }))
    setCategories((list) => (list.includes(item) ? list.filter((c) => c !== item) : [...list, item]))
  }

  const submitAll = async () => {
    setServerError('')
    setBusy(true)
    try {
      const body = new FormData()
      body.set('role', role)
      for (const key of ['companyName', 'contactPerson', 'email', 'phone', 'password', 'businessType', 'gstin', 'city', 'yearsInOperation']) {
        body.set(key, form[key].trim ? form[key].trim() : form[key])
      }
      categories.forEach((c) => body.append('categories', c))
      files.forEach((f) => body.append('documents', f))
      body.set('acceptTerms', String(accepted))
      await api('/api/auth/register', { method: 'POST', form: body })
      setSubmitted(true)
    } catch (err) {
      setServerError(err.message)
      if (err.field && FIELD_STEP[err.field]) {
        setStep(FIELD_STEP[err.field])
        setErrors((e) => ({ ...e, [err.field]: err.message }))
      } else if (err.status === 409) {
        setStep(1)
        setErrors((e) => ({ ...e, [/phone/i.test(err.message) ? 'phone' : 'email']: err.message }))
      }
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (event) => {
    event.preventDefault()
    setServerError('')
    const found = validateStep(step, form, role, categories, files)
    setErrors(found)
    if (Object.keys(found).length) return
    if (step < 4) return setStep(step + 1)
    if (!accepted) return setErrors({ acceptTerms: 'Please accept the platform terms.' })
    submitAll()
  }

  if (submitted) {
    return (
      <AuthShell title="Application submitted" subtitle="Your company profile is now awaiting verification.">
        <div className="success-state">
          <span>
            <CheckCircle2 size={34} />
          </span>
          <h3>We&apos;ll review your documents</h3>
          <p>
            Verification status: <Badge tone="amber">Under review</Badge>
          </p>
          <p>
            We usually review complete applications within 2–3 business days. Recycler access remains
            restricted until authorization is approved.
          </p>
          <Button className="btn--full" onClick={() => go('login')}>
            Continue to login
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={role ? `Register as ${role === 'buyer' ? 'Recycler' : 'Seller'}` : 'Create an account'}
      subtitle={
        role
          ? `Step ${step} of 4 · ${steps[step - 1]}`
          : 'Choose the account type that best fits your business.'
      }
    >
      {!role ? (
        <div className="role-grid">
          <button className="role-card" onClick={() => setRole('seller')}>
            <span>
              <Factory size={28} />
            </span>
            <h3>Seller</h3>
            <p>List industrial scrap and receive managed enquiries from verified recyclers.</p>
            <ul>
              <li>
                <Check size={15} /> Create scrap listings
              </li>
              <li>
                <Check size={15} /> Track negotiations
              </li>
              <li>
                <Check size={15} /> Manage settlements
              </li>
            </ul>
            <b>
              Register as Seller <ArrowRight size={16} />
            </b>
          </button>
          <button className="role-card" onClick={() => setRole('buyer')}>
            <span>
              <Recycle size={28} />
            </span>
            <h3>Recycler / Buyer</h3>
            <p>Discover approved lots and submit private offers in authorized categories.</p>
            <ul>
              <li>
                <Check size={15} /> Access verified supply
              </li>
              <li>
                <Check size={15} /> Place private offers
              </li>
              <li>
                <Check size={15} /> Track deal fulfilment
              </li>
            </ul>
            <b>
              Register as Recycler <ArrowRight size={16} />
            </b>
          </button>
          <p className="role-note">
            <ShieldCheck size={16} /> Recycler accounts require valid category-specific
            authorizations. Category selection alone is not proof of authorization.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="progress-steps">
            {[1, 2, 3, 4].map((item) => (
              <span className={step >= item ? 'active' : ''} key={item}>
                {step > item ? <Check size={14} /> : item}
              </span>
            ))}
          </div>
          {serverError && <div className="form-alert form-alert--danger" role="alert">{serverError}</div>}

          {step === 1 && (
            <div className="form-grid">
              <Field label="Company name" placeholder="Enter registered company name" value={form.companyName} onChange={set('companyName')} error={errors.companyName} autoComplete="organization" />
              <Field label="Contact person" placeholder="Full name" value={form.contactPerson} onChange={set('contactPerson')} error={errors.contactPerson} autoComplete="name" />
              <Field label="Business email" type="email" placeholder="name@company.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
              <Field label="Phone number" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" inputMode="tel" />
              <Field label="Password" type="password" placeholder="8+ characters, letter and number" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
              <Field label="Confirm password" type="password" placeholder="Re-enter password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
            </div>
          )}

          {step === 2 && (
            <div className="form-grid">
              <Field
                label="Business type"
                placeholder={role === 'buyer' ? 'Recycler / processor' : 'Manufacturer / supplier'}
                value={form.businessType}
                onChange={set('businessType')}
                error={errors.businessType}
              />
              <Field label="GSTIN" placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={(v) => set('gstin')(v.toUpperCase())} error={errors.gstin} maxLength={15} />
              <Field label="Registered city" placeholder="City, State" value={form.city} onChange={set('city')} error={errors.city} />
              <Field label="Years in operation" placeholder="e.g. 8 years" value={form.yearsInOperation} onChange={set('yearsInOperation')} />
              {role === 'buyer' && (
                <div className="field field--full">
                  <span>Authorized scrap categories</span>
                  <div className="chip-picker">
                    {CATEGORIES.map((item) => (
                      <button
                        type="button"
                        key={item}
                        className={categories.includes(item) ? 'selected' : ''}
                        aria-pressed={categories.includes(item)}
                        onClick={() => toggleCategory(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  {errors.categories && <em className="field__error">{errors.categories}</em>}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="upload-zone">
              <UploadCloud size={34} />
              <h3>Upload verification documents</h3>
              <p>
                {role === 'buyer'
                  ? 'Upload recycler registration, pollution control authorization and category-specific licences.'
                  : 'Upload GST registration, company proof and relevant business documents.'}
              </p>
              <FilePicker files={files} onChange={(next) => { setFiles(next); setErrors({}) }} mode="docs" max={8} buttonLabel="Select files" />
              {errors.documents && <p className="file-picker__error">{errors.documents}</p>}
              <small>PDF, JPG or PNG · Up to 10 MB each</small>
            </div>
          )}

          {step === 4 && (
            <div className="review-box">
              <div>
                <b>Account type</b>
                <span>{role === 'buyer' ? 'Recycler / Buyer' : 'Seller'}</span>
              </div>
              <div>
                <b>Company</b>
                <span>{form.companyName}</span>
              </div>
              <div>
                <b>Contact</b>
                <span>{form.contactPerson} · {form.email}</span>
              </div>
              <div>
                <b>GSTIN</b>
                <span>{form.gstin}</span>
              </div>
              {role === 'buyer' && (
                <div>
                  <b>Categories</b>
                  <span>{categories.join(', ')}</span>
                </div>
              )}
              <div>
                <b>Verification</b>
                <span>
                  <Badge tone="amber">Pending review</Badge>
                </span>
              </div>
              <div>
                <b>Documents</b>
                <span>{files.length} {files.length === 1 ? 'file' : 'files'} attached</span>
              </div>
              <label className="check-control">
                <input type="checkbox" checked={accepted} onChange={(e) => { setAccepted(e.target.checked); setErrors({}) }} /> I confirm the information is accurate and accept
                the platform terms.
              </label>
              {errors.acceptTerms && <em className="field__error" style={{ padding: '0 15px 12px' }}>{errors.acceptTerms}</em>}
            </div>
          )}

          <div className="form-navigation">
            <Button variant="ghost" onClick={() => (step === 1 ? setRole(null) : setStep(step - 1))}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button type="submit" loading={busy}>
              {step === 4 ? 'Submit application' : 'Continue'} <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
