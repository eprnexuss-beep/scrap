import { useEffect, useState } from 'react'
import { useRouter } from '@/lib/router'
import { ArrowLeft, FileCheck2 } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { MarginCard } from '@/components/admin/margin-card'
import { PageState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, TextAreaField } from '@/components/ui/field'
import { useFetch } from '@/hooks/use-fetch'
import { api } from '@/lib/api'
import { listingBadge } from '@/lib/status'
import { formatBytes, formatDate, formatPrice, formatQty } from '@/lib/format'

export function AdminListingDetail({ id }) {
  const router = useRouter()
  const { data, error, loading, reload } = useFetch(`/api/admin/listings/${id}`)
  const [type, setType] = useState('fixed')
  const [value, setValue] = useState('')
  const [days, setDays] = useState('7')
  const [docIds, setDocIds] = useState([])
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState({ kind: '', text: '' })
  const l = data?.listing

  // Pre-fill from the listing (already priced) or the platform defaults (new submission).
  useEffect(() => {
    if (!data) return
    const { listing, pricingDefaults } = data
    const priced = listing.buyerPrice != null
    setType(priced ? listing.marginType : pricingDefaults.defaultMarginType)
    setValue(String(priced ? listing.marginValue : pricingDefaults.defaultMarginValue))
    setDays(String(pricingDefaults.offerWindowDays))
    setDocIds(listing.documents.filter((d) => d.buyerVisible).map((d) => d.id))
  }, [data])

  const run = async (kind, json, success) => {
    setMsg({ kind: '', text: '' })
    setBusy(kind)
    try {
      await api(`/api/admin/listings/${id}`, { method: 'PATCH', json })
      setMsg({ kind: 'success', text: success })
      await reload()
    } catch (err) {
      setMsg({ kind: 'danger', text: err.message })
    } finally {
      setBusy('')
    }
  }

  const marginNum = Number(value)
  const pending = l?.status === 'pending'
  const open = l && ['active', 'negotiation'].includes(l.status)
  const badge = l && listingBadge(l.status)
  const toggleDoc = (docId) => setDocIds((cur) => (cur.includes(docId) ? cur.filter((x) => x !== docId) : [...cur, docId]))

  return (
    <DashboardShell role="admin" title={l ? l.title : 'Listing review'} subtitle={l ? `Ref #${l.ref}` : ''} active="Listings">
      <button className="back-link" onClick={() => router.push('/admin-dashboard/listings')}><ArrowLeft size={16} /> Back to listings</button>
      <PageState loading={loading} error={error}>
        {l && (
          <div className="details-layout">
            <div className="details-main">
              <div className="gallery">
                <img src={l.cover} alt={l.title} />
                <div>{l.images.slice(1, 4).map((img) => <img key={img.id} src={img.url} alt="" />)}</div>
              </div>
              <section className="card detail-card">
                <div className="detail-title">
                  <div>
                    <div><Badge tone={badge.tone}>{badge.label}</Badge></div>
                    <h1>{l.title}</h1>
                    <p>{l.category} · Ref #{l.ref} · Submitted {formatDate(l.createdAt, true)}</p>
                  </div>
                </div>
                {l.status === 'rejected' && <div className="form-alert form-alert--danger"><b>Rejected.</b> {l.rejectionReason}</div>}
                <div className="spec-grid">
                  <div><small>Quantity</small><b>{formatQty(l.quantity, l.unit)}</b></div>
                  <div><small>Seller price (private)</small><b>{formatPrice(l.sellerPrice, l.unit)}</b></div>
                  <div><small>Buyer price</small><b>{l.buyerPrice ? formatPrice(l.buyerPrice, l.unit) : 'Not set'}</b></div>
                  <div><small>Location</small><b>{[l.city, l.state].filter(Boolean).join(', ') || '—'}</b></div>
                </div>
                {l.description && (<><h3>Description</h3><p>{l.description}</p></>)}
                <h3>Condition, grade & fulfilment</h3>
                <p>{[l.condition, l.qualityGrade, l.fulfilment].filter(Boolean).join(' · ') || '—'}</p>
                {l.pickupArea && (<><h3>Pickup area (private)</h3><p>{l.pickupArea}</p></>)}
                {l.loadingNotes && (<><h3>Loading requirements</h3><p>{l.loadingNotes}</p></>)}
                {l.pricingNotes && (<><h3>Seller’s pricing notes</h3><p>{l.pricingNotes}</p></>)}
                <h3>Seller</h3>
                <p>{data.seller.companyName} · {data.seller.contactPerson} · {data.seller.email} · GSTIN {data.seller.gstin || '—'}</p>
                <h3>Photos ({l.images.length})</h3>
                <div className="thumb-row">{l.images.map((img) => <a key={img.id} href={img.url} target="_blank" rel="noreferrer"><img src={img.url} alt="" /></a>)}</div>
                <h3>Documents — tick the ones buyers may preview</h3>
                {l.documents.length === 0 && <p>No documents attached.</p>}
                {l.documents.map((d) => (
                  <div className="document-row" key={d.id} style={{ marginBottom: 8 }}>
                    <FileCheck2 size={19} />
                    <span><b>{d.filename}</b><small>{formatBytes(d.size)}</small></span>
                    <label className="check-control"><input type="checkbox" checked={docIds.includes(d.id)} onChange={() => toggleDoc(d.id)} disabled={!pending && !open} /> Buyer access</label>
                    <a className="btn btn--ghost" href={d.url} target="_blank" rel="noreferrer">Open</a>
                  </div>
                ))}
                {open && l.documents.length > 0 && (
                  <Button variant="secondary" onClick={() => run('docs', { action: 'set_documents', documentIds: docIds }, 'Document access updated.')} loading={busy === 'docs'}>Save document access</Button>
                )}
              </section>
            </div>
            <aside>
              {msg.text && <div className={`form-alert form-alert--${msg.kind}`}>{msg.text}</div>}
              {(pending || open) ? (
                <MarginCard base={l.sellerPrice} unit={l.unit} type={type} value={value} onType={setType} onValue={setValue} title={pending ? 'Set pricing & approve' : 'Pricing'}>
                  {pending && (
                    <Field label="Offer window (days)" type="number" min="1" max="60" value={days} onChange={setDays} />
                  )}
                  {pending ? (
                    <>
                      <Button className="btn--full" loading={busy === 'approve'} onClick={() => run('approve', { action: 'approve', marginType: type, marginValue: marginNum, offerWindowDays: Number(days) || 7, documentIds: docIds }, 'Listing approved and live for verified buyers.')}>
                        Approve & publish
                      </Button>
                      <div style={{ marginTop: 14 }}>
                        <TextAreaField label="Reason (shown to seller if rejected)" value={reason} onChange={setReason} placeholder="e.g. Photos don't show the full lot." />
                        <Button variant="secondary" className="btn--full" loading={busy === 'reject'} onClick={() => run('reject', { action: 'reject', reason }, 'Listing rejected and the seller was notified.')}>Reject listing</Button>
                      </div>
                    </>
                  ) : (
                    <Button className="btn--full" loading={busy === 'pricing'} onClick={() => run('pricing', { action: 'update_pricing', marginType: type, marginValue: marginNum }, 'Pricing updated for new offers.')}>
                      Save & apply pricing
                    </Button>
                  )}
                </MarginCard>
              ) : (
                <section className="card"><div className="card-heading"><div><h2>No actions</h2><p>This listing is {badge.label.toLowerCase()}.</p></div></div></section>
              )}
            </aside>
          </div>
        )}
      </PageState>
    </DashboardShell>
  )
}
