import { useState } from 'react'
import { useRouter } from '@/lib/router'
import { ArrowLeft, ArrowRight, Check, Clock3, FileCheck2, Save, UploadCloud, X } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { useAuth } from '@/components/providers/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, SelectField, TextAreaField } from '@/components/ui/field'
import { FilePicker } from '@/components/shared/file-picker'
import { api } from '@/lib/api'
import { CATEGORIES, CONDITIONS, FULFILMENT_OPTIONS, QUALITY_GRADES, UNITS } from '@/lib/constants'
import { formatPrice } from '@/lib/format'

const listingSteps = ['Scrap details', 'Quantity & price', 'Location & pickup', 'Photos & documents', 'Review & submit']

const STEP_OF = {
  category: 1, title: 1, description: 1, condition: 1, qualityGrade: 1,
  quantity: 2, unit: 2, sellerPrice: 2, pricingNotes: 2,
  city: 3, state: 3, pickupArea: 3, fulfilment: 3, loadingNotes: 3,
  images: 4,
}

const blank = {
  category: '', title: '', description: '', condition: '', qualityGrade: '',
  quantity: '', unit: 'MT', sellerPrice: '', pricingNotes: '',
  city: '', state: '', pickupArea: '', fulfilment: 'Buyer pickup', loadingNotes: '',
}

const fromListing = (l) =>
  l
    ? Object.fromEntries(Object.keys(blank).map((k) => [k, l[k] === 0 || l[k] == null ? (k === 'unit' ? 'MT' : '') : String(l[k])]))
    : blank

function clientErrors(v, imageCount) {
  const e = {}
  if (!v.category) e.category = 'Choose a scrap category.'
  if (v.title.trim().length < 3) e.title = 'Enter the material type and grade.'
  if (!(Number(v.quantity) > 0)) e.quantity = 'Enter the available quantity.'
  if (!(Number(v.sellerPrice) > 0)) e.sellerPrice = 'Enter your expected / minimum price.'
  if (v.city.trim().length < 2) e.city = 'Enter the city.'
  if (v.state.trim().length < 2) e.state = 'Enter the state.'
  if (imageCount === 0) e.images = 'Add at least one photo of the material.'
  return e
}

export function ListingForm({ listing = null }) {
  const router = useRouter()
  const { user } = useAuth()
  const editing = !!listing
  const [step, setStep] = useState(1)
  const [v, setV] = useState(() => fromListing(listing))
  const [newImages, setNewImages] = useState([])
  const [newDocs, setNewDocs] = useState([])
  const [removeImages, setRemoveImages] = useState([])
  const [removeDocs, setRemoveDocs] = useState([])
  const [accepted, setAccepted] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState('')
  const [done, setDone] = useState(null)

  const set = (key) => (value) => {
    setV((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const keptImages = (listing?.images ?? []).filter((f) => !removeImages.includes(f.id))
  const keptDocs = (listing?.documents ?? []).filter((f) => !removeDocs.includes(f.id))
  const imageCount = keptImages.length + newImages.length
  const verified = user?.verificationStatus === 'approved'

  const send = async (intent) => {
    setServerError('')
    if (intent === 'submit') {
      const found = clientErrors(v, imageCount)
      if (Object.keys(found).length) {
        setErrors(found)
        setStep(Math.min(...Object.keys(found).map((k) => STEP_OF[k])))
        return
      }
      if (!accepted) return setServerError('Please accept the listing and verification terms.')
    } else if (!v.category || v.title.trim().length < 3) {
      setErrors({ category: v.category ? undefined : 'Choose a category to save a draft.', title: v.title.trim().length < 3 ? 'Enter a material name to save a draft.' : undefined })
      return setStep(1)
    }

    const body = new FormData()
    body.set('intent', intent)
    Object.entries(v).forEach(([k, val]) => body.set(k, val))
    newImages.forEach((f) => body.append('images', f))
    newDocs.forEach((f) => body.append('documents', f))
    removeImages.forEach((id) => body.append('removeImages', id))
    removeDocs.forEach((id) => body.append('removeDocuments', id))

    setBusy(intent)
    try {
      const data = await api(editing ? `/api/seller/listings/${listing.id}` : '/api/seller/listings', {
        method: editing ? 'PATCH' : 'POST',
        form: body,
      })
      setDone({ intent, ref: data.listing.ref })
    } catch (err) {
      setServerError(err.message)
      if (err.field && STEP_OF[err.field]) {
        setStep(STEP_OF[err.field])
        setErrors({ [err.field]: err.message })
      }
    } finally {
      setBusy('')
    }
  }

  return (
    <DashboardShell
      role="seller"
      title={editing ? `Edit listing ${listing.ref}` : 'Create a scrap listing'}
      subtitle="Complete each section before submitting for approval."
      active="Create Listing"
    >
      <div className="listing-layout">
        <div className="listing-steps">
          {listingSteps.map((label, index) => (
            <button
              className={step === index + 1 ? 'active' : step > index + 1 ? 'done' : ''}
              onClick={() => setStep(index + 1)}
              key={label}
              disabled={!!done}
            >
              <span>{step > index + 1 ? <Check size={14} /> : index + 1}</span>
              <b>{label}</b>
            </button>
          ))}
        </div>
        <div className="listing-form card">
          {done ? (
            <div className="success-state">
              <span>
                <Clock3 size={34} />
              </span>
              <h2>{done.intent === 'submit' ? 'Listing submitted for approval' : 'Draft saved'}</h2>
              <p>
                {done.intent === 'submit' ? (
                  <>
                    Your listing <b>#{done.ref}</b> will be visible to eligible verified buyers only after the
                    EPR Nexuss review is complete.
                  </>
                ) : (
                  <>
                    Your draft <b>#{done.ref}</b> is saved. Finish and submit it whenever you&apos;re ready.
                  </>
                )}
              </p>
              <Badge tone={done.intent === 'submit' ? 'amber' : 'gray'}>
                {done.intent === 'submit' ? 'Pending approval' : 'Draft'}
              </Badge>
              <Button onClick={() => router.push('/seller/listings')}>View my listings</Button>
            </div>
          ) : (
            <>
              <div className="card-heading">
                <div>
                  <Badge>STEP {step} OF 5</Badge>
                  <h2>{listingSteps[step - 1]}</h2>
                  <p>Provide accurate information to help our team verify and match your lot.</p>
                </div>
              </div>
              {serverError && <div className="form-alert form-alert--danger" role="alert">{serverError}</div>}

              {step === 1 && (
                <div className="form-grid">
                  <SelectField label="Scrap category" value={v.category} onChange={set('category')} options={CATEGORIES} placeholder="Select category" error={errors.category} />
                  <Field label="Material type & grade" placeholder="e.g. Mixed E-Waste, Grade A" value={v.title} onChange={set('title')} error={errors.title} />
                  <TextAreaField className="field--full" label="Description" value={v.description} onChange={set('description')} placeholder="Describe material composition, condition and quality..." />
                  <SelectField label="Condition" value={v.condition} onChange={set('condition')} options={CONDITIONS} placeholder="Used / processed / baled" />
                  <SelectField label="Quality grade" value={v.qualityGrade} onChange={set('qualityGrade')} options={QUALITY_GRADES} placeholder="Select grade" />
                </div>
              )}

              {step === 2 && (
                <div className="form-grid">
                  <Field label="Available quantity" placeholder="5" inputMode="decimal" value={v.quantity} onChange={set('quantity')} error={errors.quantity} />
                  <SelectField label="Unit" value={v.unit} onChange={set('unit')} options={UNITS} placeholder="Unit" />
                  <Field label="Expected / minimum price" placeholder="45000" inputMode="decimal" value={v.sellerPrice} onChange={set('sellerPrice')} error={errors.sellerPrice} hint="Private. Buyers never see this price." />
                  <Field label="Price unit" value={`INR per ${v.unit || 'MT'}`} readOnly />
                  <TextAreaField className="field--full" label="Pricing notes" value={v.pricingNotes} onChange={set('pricingNotes')} placeholder="Optional pricing details..." />
                </div>
              )}

              {step === 3 && (
                <div className="form-grid">
                  <Field label="City" placeholder="New Delhi" value={v.city} onChange={set('city')} error={errors.city} />
                  <Field label="State" placeholder="Delhi NCR" value={v.state} onChange={set('state')} error={errors.state} />
                  <Field label="Approximate pickup area" placeholder="Industrial area / locality" value={v.pickupArea} onChange={set('pickupArea')} hint="Kept private until the deal stage." />
                  <SelectField label="Fulfilment preference" value={v.fulfilment} onChange={set('fulfilment')} options={FULFILMENT_OPTIONS} placeholder="Select" />
                  <TextAreaField className="field--full" label="Loading requirements" value={v.loadingNotes} onChange={set('loadingNotes')} placeholder="Equipment, timing or access details..." />
                </div>
              )}

              {step === 4 && (
                <>
                  <div className="upload-grid">
                    <div className="upload-zone">
                      <UploadCloud size={30} />
                      <h3>Material photos</h3>
                      <p>Add clear images from multiple angles (JPG, PNG or WEBP, up to 8).</p>
                      <FilePicker files={newImages} onChange={(f) => { setNewImages(f); setErrors({}) }} mode="images" max={Math.max(0, 8 - keptImages.length)} buttonLabel="Upload photos" />
                      <ExistingFiles files={keptImages} onRemove={(id) => setRemoveImages((r) => [...r, id])} />
                    </div>
                    <div className="upload-zone">
                      <FileCheck2 size={30} />
                      <h3>Supporting documents</h3>
                      <p>Attach test reports or inventory sheets (PDF, up to 5).</p>
                      <FilePicker files={newDocs} onChange={setNewDocs} mode="pdf" max={Math.max(0, 5 - keptDocs.length)} buttonLabel="Upload documents" />
                      <ExistingFiles files={keptDocs} onRemove={(id) => setRemoveDocs((r) => [...r, id])} />
                    </div>
                  </div>
                  {errors.images && <p className="file-picker__error" style={{ textAlign: 'center' }}>{errors.images}</p>}
                </>
              )}

              {step === 5 && (
                <div className="review-box">
                  <div><b>Material</b><span>{v.title || '—'}{v.qualityGrade ? ` · ${v.qualityGrade}` : ''}</span></div>
                  <div><b>Category</b><span>{v.category || '—'}</span></div>
                  <div><b>Quantity</b><span>{v.quantity ? `${v.quantity} ${v.unit}` : '—'}</span></div>
                  <div><b>Seller price</b><span>{Number(v.sellerPrice) > 0 ? `${formatPrice(v.sellerPrice, v.unit)} · Private` : '—'}</span></div>
                  <div><b>Pickup</b><span>{[v.city, v.state].filter(Boolean).join(', ') || '—'} · {v.fulfilment}</span></div>
                  <div><b>Files</b><span>{imageCount} photos · {keptDocs.length + newDocs.length} documents</span></div>
                  {!verified && (
                    <div className="form-alert form-alert--danger" style={{ margin: 15 }}>
                      Your account is still being verified. You can save this as a draft now and submit it once you are approved.
                    </div>
                  )}
                  <label className="check-control">
                    <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> I accept the listing and verification terms.
                  </label>
                </div>
              )}

              <div className="form-navigation">
                <Button variant="ghost" onClick={() => (step === 1 ? router.push('/seller/listings') : setStep(step - 1))}>
                  <ArrowLeft size={16} /> Back
                </Button>
                {step < 5 ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="secondary" onClick={() => send('draft')} loading={busy === 'draft'}>
                      <Save size={15} /> Save draft
                    </Button>
                    <Button onClick={() => setStep(step + 1)}>
                      Continue <ArrowRight size={16} />
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="secondary" onClick={() => send('draft')} loading={busy === 'draft'}>
                      <Save size={15} /> Save as draft
                    </Button>
                    <Button onClick={() => send('submit')} loading={busy === 'submit'} disabled={!verified}>
                      Submit for approval <ArrowRight size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

function ExistingFiles({ files, onRemove }) {
  if (!files.length) return null
  return (
    <ul className="file-list">
      {files.map((f) => (
        <li key={f.id}>
          <a href={f.url} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'inherit' }}>
            {f.filename}
          </a>
          <small>saved</small>
          <button type="button" aria-label={`Remove ${f.filename}`} onClick={() => onRemove(f.id)}>
            <X size={14} />
          </button>
        </li>
      ))}
    </ul>
  )
}
