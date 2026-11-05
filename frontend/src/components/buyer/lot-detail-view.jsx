import { useState } from 'react'
import { useRouter } from '@/lib/router'
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, Heart, ShieldCheck, X } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, TextAreaField } from '@/components/ui/field'
import { useFetch } from '@/hooks/use-fetch'
import { api } from '@/lib/api'
import { formatBytes, formatINR, formatNumber, formatPrice, formatQty } from '@/lib/format'

export function LotDetailView({ id }) {
  const router = useRouter()
  const { data, error, loading, reload } = useFetch(`/api/buyer/listings/${id}`)
  const l = data?.listing
  const open = data?.openOffer
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('')
  const [until, setUntil] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [review, setReview] = useState(false)
  const [sent, setSent] = useState(null)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState('')
  const [saved, setSaved] = useState(null)

  const priceNum = Number(price)
  const qtyNum = Number(qty)

  const validate = () => {
    const e = {}
    if (!(priceNum > 0)) e.price = 'Enter your offer price.'
    if (!(qtyNum > 0)) e.qty = 'Enter the quantity you want.'
    else if (qtyNum > l.available) e.qty = `Only ${formatQty(l.available, l.unit)} is available.`
    if (until && new Date(`${until}T23:59:59`) < new Date()) e.until = 'Choose a future date.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    setServerError('')
    setBusy(true)
    try {
      const res = await api('/api/buyer/offers', {
        method: 'POST',
        json: { listingId: id, pricePerUnit: priceNum, quantity: qtyNum, validUntil: until || null, message },
      })
      setSent(res.offer)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const toggleSave = async () => {
    const res = await api(`/api/buyer/listings/${id}/save`, { method: 'POST' }).catch(() => null)
    if (res) setSaved(res.saved)
  }

  const closeModal = () => {
    setReview(false)
    if (sent) {
      setSent(null)
      reload()
    }
  }

  return (
    <DashboardShell role="buyer" title="Listing details" subtitle="Approved lot · Seller identity protected" active="Available Lots">
      <button className="back-link" onClick={() => router.push('/marketplace')}>
        <ArrowLeft size={16} /> Back to marketplace
      </button>
      <PageState loading={loading} error={error}>
        {l && (
          <div className="details-layout">
            <div className="details-main">
              <div className="gallery">
                <img src={l.images[0]?.url ?? l.cover} alt={l.title} />
                <div>{l.images.slice(1, 4).map((img) => <img key={img.id} src={img.url} alt="" />)}</div>
              </div>
              <section className="card detail-card">
                <div className="detail-title">
                  <div>
                    <div>
                      <Badge>APPROVED LISTING</Badge>
                      <Badge tone="blue">Verified material</Badge>
                    </div>
                    <h1>{l.title}</h1>
                    <p>{l.category} · Ref #{l.ref}</p>
                  </div>
                  <button className="icon-button" onClick={toggleSave} aria-label="Save lot">
                    <Heart size={19} fill={(saved ?? l.saved) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="spec-grid">
                  <div><small>Available quantity</small><b>{formatQty(l.available, l.unit)}</b></div>
                  <div><small>Buyer asking price</small><b>{formatPrice(l.buyerPrice, l.unit)}</b></div>
                  <div><small>Approximate location</small><b>{[l.city, l.state].filter(Boolean).join(', ')}</b></div>
                  <div><small>Fulfilment</small><b>{l.fulfilment || 'Buyer pickup'}</b></div>
                </div>
                {l.description && (<><h3>Material description</h3><p>{l.description}</p></>)}
                {(l.condition || l.qualityGrade) && (<><h3>Condition & grade</h3><p>{[l.condition, l.qualityGrade].filter(Boolean).join(' · ')}</p></>)}
                <h3>Quality & approved documents</h3>
                {l.documents.length === 0 && <p>No documents have been approved for preview on this lot.</p>}
                {l.documents.map((d) => (
                  <div className="document-row" key={d.id} style={{ marginBottom: 8 }}>
                    <FileCheck2 size={19} />
                    <span><b>{d.filename}</b><small>Approved for buyer access · PDF · {formatBytes(d.size)}</small></span>
                    <a className="btn btn--ghost" href={d.url} target="_blank" rel="noreferrer">Preview</a>
                  </div>
                ))}
                <div className="privacy-note">
                  <ShieldCheck size={20} />
                  <div>
                    <b>Protected transaction details</b>
                    <p>Seller identity, exact pickup address, private seller price and internal EPR Nexuss margin remain protected until the authorized deal stage.</p>
                  </div>
                </div>
              </section>
            </div>
            <aside className="offer-panel card">
              {l.daysLeft != null && <Badge tone="amber">OFFER WINDOW · {l.daysLeft} DAY{l.daysLeft === 1 ? '' : 'S'} LEFT</Badge>}
              <h2>Place your private offer</h2>
              <p>Your offer is visible only to EPR Nexuss administrators and will never be shared with competing buyers.</p>
              <div className="asking-price">
                <small>Buyer-facing asking price</small>
                <b>{formatPrice(l.buyerPrice, l.unit)}</b>
              </div>
              {open ? (
                <div className="form-alert form-alert--success">
                  You already have offer <b>#{open.offerRef}</b> in progress on this lot.
                  <div style={{ marginTop: 10 }}>
                    <Button variant="secondary" className="btn--full" onClick={() => router.push('/buyer/offers')}>Track my offer</Button>
                  </div>
                </div>
              ) : (
                <>
                  <Field label={`Your offer (per ${l.unit})`} placeholder={`e.g. ${formatNumber(l.buyerPrice)}`} inputMode="decimal" value={price} onChange={(v) => { setPrice(v); setErrors({}) }} error={errors.price} />
                  <Field label={`Requested quantity (${l.unit})`} placeholder={String(l.available)} inputMode="decimal" value={qty} onChange={(v) => { setQty(v); setErrors({}) }} error={errors.qty} hint={`Up to ${formatQty(l.available, l.unit)}`} />
                  <Field label="Offer valid until" type="date" value={until} onChange={setUntil} error={errors.until} />
                  <TextAreaField label="Message (optional)" value={message} onChange={setMessage} placeholder="Add commercial or pickup notes..." />
                  <Button className="btn--full" onClick={() => validate() && setReview(true)}>
                    Review offer <ArrowRight size={16} />
                  </Button>
                </>
              )}
              <small className="secure-note"><ShieldCheck size={14} /> Private and encrypted offer flow</small>
            </aside>
          </div>
        )}
      </PageState>
      {review && l && (
        <div className="modal-backdrop">
          <div className="modal">
            {sent ? (
              <div className="success-state">
                <span><CheckCircle2 size={34} /></span>
                <h2>Offer submitted</h2>
                <p>Your private offer <b>#{sent.offerRef}</b> is now under review. You&apos;ll be notified of any counteroffer or decision.</p>
                <Button className="btn--full" onClick={() => router.push('/buyer/offers')}>Track my offer</Button>
                <Button variant="ghost" className="btn--full" onClick={closeModal}>Close</Button>
              </div>
            ) : (
              <>
                <div className="modal__head">
                  <div><Badge>REVIEW OFFER</Badge><h2>Confirm your offer</h2></div>
                  <button onClick={closeModal} aria-label="Close"><X size={20} /></button>
                </div>
                <div className="review-box">
                  <div><b>Material</b><span>{l.title}</span></div>
                  <div><b>Your offer</b><span>{formatINR(priceNum)} / {l.unit}</span></div>
                  <div><b>Quantity</b><span>{formatQty(qtyNum, l.unit)}</span></div>
                  <div><b>Estimated value</b><span>{formatINR(priceNum * qtyNum)}</span></div>
                </div>
                <div className="privacy-note">
                  <ShieldCheck size={19} />
                  <p>Only your offer and authorized updates will be visible to your account.</p>
                </div>
                {serverError && <div className="form-alert form-alert--danger" style={{ marginTop: 12 }}>{serverError}</div>}
                <div className="modal__actions">
                  <Button variant="secondary" onClick={closeModal}>Edit offer</Button>
                  <Button onClick={submit} loading={busy}>Submit private offer</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
