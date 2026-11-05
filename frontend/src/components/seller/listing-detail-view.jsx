import { useState } from 'react'
import { useRouter } from '@/lib/router'
import { ArrowLeft, FileCheck2, Pencil, ShieldCheck, Trash2, XCircle } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { api } from '@/lib/api'
import { listingBadge } from '@/lib/status'
import { formatBytes, formatDate, formatPrice, formatQty } from '@/lib/format'

export function SellerListingDetailView({ id }) {
  const router = useRouter()
  const { data, error, loading, reload } = useFetch(`/api/seller/listings/${id}`)
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const l = data?.listing

  const run = async (kind, fn) => {
    setActionError('')
    setBusy(kind)
    try {
      await fn()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy('')
    }
  }

  const remove = () =>
    confirm('Delete this listing and its files permanently?') &&
    run('delete', async () => {
      await api(`/api/seller/listings/${id}`, { method: 'DELETE' })
      router.replace('/seller/listings')
    })

  const close = () =>
    confirm('Close this listing? Buyers will no longer see it.') &&
    run('close', async () => {
      await api(`/api/seller/listings/${id}/close`, { method: 'POST' })
      await reload()
    })

  const badge = l && listingBadge(l.status)
  const editable = l && ['draft', 'rejected', 'pending'].includes(l.status)

  return (
    <DashboardShell role="seller" title={l ? l.title : 'Listing'} subtitle={l ? `Ref #${l.ref}` : ''} active="My Listings">
      <button className="back-link" onClick={() => router.push('/seller/listings')}>
        <ArrowLeft size={16} /> Back to my listings
      </button>
      <PageState loading={loading} error={error}>
        {l && (
          <div className="details-layout">
            <div className="details-main">
              {l.images.length > 0 ? (
                <div className="gallery">
                  <img src={l.images[0].url} alt={l.title} />
                  <div>
                    {l.images.slice(1, 4).map((img) => (
                      <img key={img.id} src={img.url} alt="" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="gallery"><img src={l.cover} alt="" /></div>
              )}
              <section className="card detail-card">
                <div className="detail-title">
                  <div>
                    <div><Badge tone={badge.tone}>{badge.label}</Badge></div>
                    <h1>{l.title}</h1>
                    <p>{l.category} · Ref #{l.ref} · Created {formatDate(l.createdAt)}</p>
                  </div>
                </div>
                {l.status === 'rejected' && (
                  <div className="form-alert form-alert--danger">
                    <b>Not approved.</b> {l.rejectionReason || 'Please review the details and resubmit.'}
                  </div>
                )}
                <div className="spec-grid">
                  <div><small>Available quantity</small><b>{formatQty(l.quantity, l.unit)}</b></div>
                  <div><small>Your price (private)</small><b>{l.sellerPrice ? formatPrice(l.sellerPrice, l.unit) : '—'}</b></div>
                  <div><small>Location</small><b>{[l.city, l.state].filter(Boolean).join(', ') || '—'}</b></div>
                  <div><small>Fulfilment</small><b>{l.fulfilment || '—'}</b></div>
                </div>
                {l.description && (<><h3>Material description</h3><p>{l.description}</p></>)}
                {(l.condition || l.qualityGrade) && (<><h3>Condition & grade</h3><p>{[l.condition, l.qualityGrade].filter(Boolean).join(' · ')}</p></>)}
                {l.pickupArea && (<><h3>Pickup area (private)</h3><p>{l.pickupArea}</p></>)}
                {l.loadingNotes && (<><h3>Loading requirements</h3><p>{l.loadingNotes}</p></>)}
                {l.pricingNotes && (<><h3>Pricing notes</h3><p>{l.pricingNotes}</p></>)}
                <h3>Documents</h3>
                {l.documents.length === 0 && <p>No documents attached.</p>}
                {l.documents.map((d) => (
                  <div className="document-row" key={d.id}>
                    <FileCheck2 size={19} />
                    <span>
                      <b>{d.filename}</b>
                      <small>{formatBytes(d.size)} · {d.buyerVisible ? 'Approved for buyer access' : 'Visible to admin only until approved'}</small>
                    </span>
                    <a className="btn btn--ghost" href={d.url} target="_blank" rel="noreferrer">Open</a>
                  </div>
                ))}
                <div className="privacy-note">
                  <ShieldCheck size={20} />
                  <div>
                    <b>Your identity stays protected</b>
                    <p>Buyers never see your company name, exact pickup address or your private price. They only see the EPR Nexuss asking price.</p>
                  </div>
                </div>
              </section>
            </div>
            <aside className="offer-panel card">
              <Badge tone={badge.tone}>{badge.label.toUpperCase()}</Badge>
              <h2>Manage listing</h2>
              <p>
                {l.status === 'pending' && 'Waiting for EPR Nexuss review. You can still edit details while it is pending.'}
                {l.status === 'draft' && 'This is a draft. Finish it and submit for approval.'}
                {l.status === 'rejected' && 'Update the listing based on the feedback and submit again.'}
                {l.status === 'active' && `Live for verified buyers. ${l.enquiries} enquiries so far.`}
                {l.status === 'negotiation' && 'A buyer deal is in progress for this lot.'}
                {['sold', 'closed'].includes(l.status) && 'This listing is no longer open to buyers.'}
              </p>
              {actionError && <div className="form-alert form-alert--danger">{actionError}</div>}
              {editable && (
                <Button className="btn--full" onClick={() => router.push(`/seller/listings/${id}/edit`)}>
                  <Pencil size={15} /> Edit listing
                </Button>
              )}
              {['active', 'pending'].includes(l.status) && (
                <Button variant="secondary" className="btn--full" onClick={close} loading={busy === 'close'}>
                  <XCircle size={15} /> Close listing
                </Button>
              )}
              {['draft', 'rejected'].includes(l.status) && (
                <Button variant="ghost" className="btn--full" onClick={remove} loading={busy === 'delete'}>
                  <Trash2 size={15} /> Delete
                </Button>
              )}
            </aside>
          </div>
        )}
      </PageState>
    </DashboardShell>
  )
}
