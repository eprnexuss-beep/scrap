import { useState } from 'react'
import { useRouter } from '@/lib/router'
import { ArrowLeft, ExternalLink, FileCheck2, ShieldCheck, X } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DealTimeline } from '@/components/shared/deal-timeline'
import { PageState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, TextAreaField } from '@/components/ui/field'
import { useFetch } from '@/hooks/use-fetch'
import { api } from '@/lib/api'
import { DEAL_TONE, adminDealLabel } from '@/lib/status'
import { formatBytes, formatDate, formatINR, formatPrice, formatQty } from '@/lib/format'

const NEXT = {
  terms_agreed: { label: 'Start inspection / weighment', hint: 'Marks the lot as inspected on site.' },
  inspection: { label: 'Schedule pickup', hint: 'Record the weighed quantity and pickup date. Buyer then sees the pickup location.' },
  pickup_scheduled: { label: 'Mark material delivered', hint: 'Confirms the buyer has collected the material.' },
  delivered: { label: 'Complete settlement', hint: 'Requires buyer payment and seller payout to be confirmed.' },
}
const initials = (n = '') => n.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
const TABS = [['overview', 'Overview'], ['offers', 'Offers'], ['parties', 'Parties'], ['documents', 'Documents'], ['timeline', 'Timeline']]

function Modal({ badge, tone = 'amber', title, children, onClose, onConfirm, confirmLabel, busy, error }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal__head">
          <div><Badge tone={tone}>{badge}</Badge><h2>{title}</h2></div>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {children}
        {error && <div className="form-alert form-alert--danger" style={{ marginTop: 12 }}>{error}</div>}
        <div className="modal__actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

export function DealDetailView({ id }) {
  const router = useRouter()
  const { data, error, loading, reload } = useFetch(`/api/admin/deals/${id}`)
  const d = data?.deal
  const [tab, setTab] = useState('overview')
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [f, setF] = useState({ price: '', qty: '', sellerPrice: '', note: '', final: '', date: '', ref: '', label: '' })
  const [file, setFile] = useState(null)
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))

  const act = async (json, then) => {
    setErr('')
    setBusy(true)
    try {
      await api(`/api/admin/deals/${id}`, { method: 'PATCH', json })
      setModal(null)
      setF((p) => ({ ...p, note: '', ref: '', final: '', date: '' }))
      await reload()
      then?.()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }
  const open = (type) => {
    setErr('')
    const last = d.rounds[d.rounds.length - 1]
    if (type === 'counter') setF((p) => ({ ...p, price: String(last.pricePerUnit), qty: String(last.quantity), note: '' }))
    if (type === 'accept') setF((p) => ({ ...p, sellerPrice: String(d.listing?.sellerPrice ?? '') }))
    setModal(type)
  }

  const upload = async () => {
    if (!file) return setErr('Choose a PDF or image first.')
    setErr('')
    setBusy(true)
    try {
      const form = new FormData()
      form.append('files', file)
      form.append('label', f.label)
      await api(`/api/admin/deals/${id}/documents`, { method: 'POST', form })
      setFile(null)
      set('label')('')
      await reload()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const last = d?.rounds[d.rounds.length - 1]
  const isOffer = !!d && ['under_review', 'counteroffer', 'rejected', 'withdrawn', 'expired'].includes(d.status)
  const awaitingAdmin = d?.status === 'under_review' && last?.by === 'buyer'
  const live = d && ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered'].includes(d.status)
  const agreed = d?.agreed
  const qty = d ? agreed?.quantity ?? last?.quantity : 0
  const nextStage = d && NEXT[d.status]
  const bothPaid = d?.buyerPayment.status === 'confirmed' && d?.sellerPayout.status === 'confirmed'
  const lastBuyer = d && [...d.rounds].reverse().find((r) => r.by === 'buyer')
  const per = d && d.ledger.quantity ? 1 : 0
  const sellerBase = d?.listing?.sellerPrice

  return (
    <DashboardShell role="admin" title={d ? (isOffer ? `Offer #${d.offerRef}` : `Deal #${d.ref}`) : 'Deal'} subtitle="Controlled negotiation and transaction ledger." active={isOffer ? 'Offers & Enquiries' : 'Deals & Negotiations'}>
      <button className="back-link" onClick={() => router.push(isOffer ? '/admin-dashboard/offers' : '/deal')}><ArrowLeft size={16} /> {isOffer ? 'Back to offers' : 'Back to deals'}</button>
      <PageState loading={loading && !data} error={error}>
        {d && (
          <>
            <div className="deal-header card">
              <div>
                <Badge tone={DEAL_TONE[d.status]}>{adminDealLabel(d)}</Badge>
                <h2>{d.listing?.title} · {formatQty(qty, d.unit)}</h2>
                <p>Created {formatDate(d.createdAt)} · {[d.listing?.city, d.listing?.state].filter(Boolean).join(', ')} · Offer #{d.offerRef}</p>
              </div>
              <div className="deal-header__actions">
                <Button variant="secondary" onClick={() => open('note')}>Add internal note</Button>
                {['terms_agreed', 'inspection', 'pickup_scheduled'].includes(d.status) && <Button variant="secondary" onClick={() => open('cancel')}>Cancel deal</Button>}
              </div>
            </div>
            <div className="deal-tabs">
              {TABS.map(([k, label]) => (
                <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}{k === 'offers' ? ` (${d.rounds.length})` : ''}</button>
              ))}
            </div>
            <div className="deal-grid">
              <div>
                {['overview', 'offers'].includes(tab) && (
                  <section className="card">
                    <div className="card-heading">
                      <div><h2>Negotiation summary</h2><p>Private offer and counteroffer history.</p></div>
                      <Badge tone="gray">ADMIN ONLY</Badge>
                    </div>
                    {d.competingOffers > 0 && <div className="form-alert form-alert--success">{d.competingOffers} other buyer{d.competingOffers === 1 ? ' has' : 's have'} an open offer on this lot. Competing identities stay hidden from each other.</div>}
                    <div className="offer-history">
                      {d.rounds.map((r, i) => {
                        const isLast = i === d.rounds.length - 1
                        const title = r.by === 'admin' ? 'Admin counteroffer' : i === 0 ? 'Original buyer offer' : isLast ? 'Latest buyer offer' : 'Buyer revised offer'
                        return (
                          <div key={r.id} className={isLast && !agreed ? 'current' : ''}>
                            <span>{i + 1}</span>
                            <div>
                              <small>{title} · {formatDate(r.at, true)}</small>
                              <b>{formatPrice(r.pricePerUnit, d.unit)} · {formatQty(r.quantity, d.unit)}</b>
                              <p>{r.note || (r.by === 'buyer' ? `Submitted by ${d.buyer?.companyName}.` : 'Counter based on seller settlement floor and authorized margin range.')}</p>
                              {isLast && awaitingAdmin && (
                                <div>
                                  <Button onClick={() => open('accept')}>Accept offer</Button>
                                  <Button variant="secondary" onClick={() => open('counter')}>Send counteroffer</Button>
                                  <Button variant="ghost" onClick={() => open('reject')}>Reject</Button>
                                </div>
                              )}
                              {isLast && d.status === 'counteroffer' && <p><b>Awaiting buyer response.</b></p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {agreed && <div className="form-alert form-alert--success" style={{ marginTop: 14 }}>Terms agreed {formatDate(agreed.at, true)} at <b>{formatPrice(agreed.pricePerUnit, d.unit)}</b> for <b>{formatQty(agreed.quantity, d.unit)}</b>.</div>}
                  </section>
                )}

                {tab === 'overview' && live && (
                  <section className="card">
                    <div className="card-heading"><div><h2>Fulfilment control</h2><p>{nextStage.hint}</p></div></div>
                    {d.status === 'inspection' && (
                      <div className="form-grid">
                        <Field label={`Weighed quantity (${d.unit})`} type="number" step="any" value={f.final} onChange={set('final')} placeholder={String(agreed.quantity)} hint={`Agreed: ${formatQty(agreed.quantity, d.unit)}. Leave blank to keep it.`} />
                        <Field label="Pickup date" type="date" value={f.date} onChange={set('date')} />
                        <TextAreaField className="field--full" label="Pickup notes (shown to buyer)" value={f.note} onChange={set('note')} placeholder="Gate, contact person, vehicle requirements..." />
                      </div>
                    )}
                    {err && !modal && <div className="form-alert form-alert--danger">{err}</div>}
                    <Button
                      loading={busy}
                      disabled={d.status === 'delivered' && !bothPaid}
                      onClick={() => act({ action: 'advance', note: f.note, ...(d.status === 'inspection' ? { scheduledFor: f.date || null, ...(Number(f.final) > 0 ? { finalQuantity: Number(f.final) } : {}) } : {}) })}
                    >
                      {nextStage.label}
                    </Button>
                    {d.status === 'delivered' && !bothPaid && <p className="ledger-note">Confirm both payments in the Payments panel to enable settlement.</p>}
                  </section>
                )}

                {['overview', 'timeline'].includes(tab) && (
                  <section className="card">
                    <div className="card-heading"><div><h2>Fulfilment timeline</h2><p>Inspection, weighment and delivery milestones.</p></div></div>
                    <DealTimeline timeline={d.timeline} closed={['rejected', 'withdrawn', 'cancelled', 'expired'].includes(d.status)} />
                  </section>
                )}

                {tab === 'timeline' && (
                  <section className="card">
                    <div className="card-heading"><div><h2>Internal notes</h2><p>Visible to admins only.</p></div></div>
                    {d.internalNotes.length === 0 && <p className="muted">No notes yet.</p>}
                    {d.internalNotes.map((n) => (
                      <div className="activity-row" key={n.id}><div><b>{n.text}</b><small>{n.by} · {formatDate(n.at, true)}</small></div></div>
                    ))}
                  </section>
                )}

                {tab === 'parties' && (
                  <section className="card">
                    <div className="card-heading"><div><h2>Authorized parties</h2><p>Visible to admin only.</p></div></div>
                    {[['SELLER', d.seller], ['BUYER', d.buyer]].map(([role, p]) => p && (
                      <div className="party" key={role}>
                        <span>{initials(p.companyName)}</span>
                        <div><small>{role}</small><b>{p.companyName}</b><p>{p.contactPerson} · {p.email} · {p.phone || '—'}</p><p>{p.city} · {p.verificationStatus}{p.categories?.length ? ` · ${p.categories.join(', ')}` : ''}</p></div>
                      </div>
                    ))}
                  </section>
                )}

                {tab === 'documents' && (
                  <section className="card">
                    <div className="card-heading"><div><h2>Deal documents</h2><p>Weighment slips, invoices, payment proofs. Admin only.</p></div></div>
                    {d.documents.length === 0 && <p className="muted">No documents yet.</p>}
                    {d.documents.map((doc) => (
                      <div className="document-row" key={doc.id} style={{ marginBottom: 8 }}>
                        <FileCheck2 size={19} />
                        <span><b>{doc.filename}</b><small>{formatBytes(doc.size)}</small></span>
                        <a className="btn btn--ghost" href={doc.url} target="_blank" rel="noreferrer">Open</a>
                      </div>
                    ))}
                    <div className="form-grid" style={{ marginTop: 16 }}>
                      <Field label="Label" placeholder="e.g. Weighment slip" value={f.label} onChange={set('label')} />
                      <label className="field"><span>File (PDF / image)</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
                    </div>
                    {err && <div className="form-alert form-alert--danger">{err}</div>}
                    <Button variant="secondary" onClick={upload} loading={busy}>Upload document</Button>
                  </section>
                )}
              </div>

              <aside>
                <section className="card">
                  <div className="card-heading"><div><h2>Price & revenue ledger</h2><p>Final revenue recalculates from accepted terms.</p></div></div>
                  <div className="ledger">
                    <div><span>Original seller base</span><b>{formatPrice(sellerBase, d.unit)}</b></div>
                    {agreed && <div><span>Negotiated seller settlement / unit</span><b>{formatPrice(d.sellerPriceSnapshot, d.unit)}</b></div>}
                    <div><span>Original buyer ask</span><b>{formatPrice(d.listing?.buyerPrice, d.unit)}</b></div>
                    <div><span>{agreed ? 'Agreed price' : 'Latest buyer offer'}</span><b>{formatPrice(agreed?.pricePerUnit ?? lastBuyer?.pricePerUnit, d.unit)}</b></div>
                    <hr />
                    <div><span>{d.ledger.kind === 'agreed' ? 'Seller settlement' : 'Proposed seller settlement'}</span><b>{formatINR(d.ledger.sellerAmount)}</b></div>
                    <div><span>{d.ledger.kind === 'agreed' ? 'Buyer amount' : 'Proposed buyer amount'}</span><b>{formatINR(d.ledger.buyerAmount)}</b></div>
                    <div className="ledger__revenue"><span>{d.ledger.kind === 'agreed' ? 'Platform revenue' : 'Projected platform revenue'}</span><b>{formatINR(d.ledger.revenue)}</b></div>
                  </div>
                  <p className="ledger-note">Revenue is based on the latest approved commercial terms and may differ from the original listing margin.{d.finalQuantity ? ` Calculated on the weighed quantity of ${formatQty(d.finalQuantity, d.unit)}.` : ''}</p>
                </section>

                {agreed && (
                  <section className="card">
                    <div className="card-heading"><div><h2>Payments</h2><p>Confirm money in and out.</p></div></div>
                    {[['buyer', 'Buyer pays EPR Nexuss', d.buyerPayment, d.ledger.buyerAmount], ['seller', 'EPR Nexuss pays seller', d.sellerPayout, d.ledger.sellerAmount]].map(([party, label, p, amount]) => (
                      <div key={party} className="pay-block">
                        <div className="pay-block__top"><b>{label}</b><Badge tone={p.status === 'confirmed' ? 'green' : 'amber'}>{p.status === 'confirmed' ? 'Confirmed' : 'Pending'}</Badge></div>
                        <div className="pay-block__amount">{formatINR(amount)}</div>
                        {p.status === 'confirmed' ? (
                          <small className="muted">Ref {p.reference} · {formatDate(p.confirmedAt, true)}</small>
                        ) : (
                          <>
                            {party === 'buyer' && (d.buyerPayment.hasProof ? <a className="table-action" href={d.buyerPayment.proofUrl} target="_blank" rel="noreferrer">View buyer’s proof <ExternalLink size={13} /></a> : <small className="muted">No proof uploaded yet.</small>)}
                            {live && (party === 'buyer' || d.buyerPayment.status === 'confirmed') && <Button variant="secondary" className="btn--full" onClick={() => open(`pay-${party}`)}>Confirm {party === 'buyer' ? 'payment received' : 'payout sent'}</Button>}
                            {party === 'seller' && d.buyerPayment.status !== 'confirmed' && <small className="muted">Unlocks after the buyer’s payment is confirmed.</small>}
                          </>
                        )}
                      </div>
                    ))}
                  </section>
                )}

                {tab !== 'parties' && (
                  <section className="card">
                    <div className="card-heading"><div><h2>Authorized parties</h2><p>Visible to admin only.</p></div></div>
                    {[['SELLER', d.seller], ['BUYER', d.buyer]].map(([role, p]) => p && (
                      <div className="party" key={role}><span>{initials(p.companyName)}</span><div><small>{role}</small><b>{p.companyName}</b><p>{p.verificationStatus === 'approved' ? 'Verified' : p.verificationStatus} · {p.city}</p></div></div>
                    ))}
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
      </PageState>

      {modal === 'accept' && d && (
        <Modal badge="CONSEQUENTIAL ACTION" title="Accept latest offer?" onClose={() => setModal(null)} busy={busy} error={err} confirmLabel="Confirm & accept offer" onConfirm={() => act({ action: 'accept', sellerPricePerUnit: Number(f.sellerPrice) })}>
          <p>The buyer's accepted price will remain {formatPrice(last.pricePerUnit, d.unit)} for {formatQty(last.quantity, d.unit)}. Enter the seller's separately negotiated settlement price below. The difference is recorded as EPR Nexuss platform revenue.</p>
          <div className="form-grid" style={{ marginTop: 14 }}>
            <Field label={`Accepted buyer price per ${d.unit}`} value={String(last.pricePerUnit)} disabled />
            <Field label={`Negotiated seller settlement per ${d.unit}`} type="number" step="any" value={f.sellerPrice} onChange={set('sellerPrice')} hint={`Original seller base: ${formatPrice(sellerBase, d.unit)}. Change this only after confirming the revised price with the seller.`} />
          </div>
          <div className="form-alert form-alert--success" style={{ marginTop: 12 }}>
            Estimated platform margin: <b>{formatPrice(Number(last.pricePerUnit) - Number(f.sellerPrice || 0), d.unit)}</b> per unit.
          </div>
          <div className="privacy-note"><ShieldCheck size={19} /><p>Buyer and seller will receive role-appropriate notifications. Internal pricing details remain private.</p></div>
        </Modal>
      )}
      {modal === 'counter' && d && (
        <Modal badge="COUNTEROFFER" title="Send counteroffer" tone="blue" onClose={() => setModal(null)} busy={busy} error={err} confirmLabel="Send counteroffer" onConfirm={() => act({ action: 'counter', pricePerUnit: Number(f.price), quantity: Number(f.qty), note: f.note })}>
          <div className="form-grid">
            <Field label={`Price per ${d.unit}`} type="number" step="any" value={f.price} onChange={set('price')} hint={`Seller base ${formatPrice(sellerBase, d.unit)} · Listed ${formatPrice(d.listing?.buyerPrice, d.unit)}`} />
            <Field label={`Quantity (${d.unit})`} type="number" step="any" value={f.qty} onChange={set('qty')} />
            <TextAreaField className="field--full" label="Message to buyer (optional)" value={f.note} onChange={set('note')} />
          </div>
        </Modal>
      )}
      {modal === 'reject' && (
        <Modal badge="REJECT OFFER" tone="red" title="Reject this offer?" onClose={() => setModal(null)} busy={busy} error={err} confirmLabel="Reject offer" onConfirm={() => act({ action: 'reject', note: f.note })}>
          <TextAreaField label="Reason (shown to buyer)" value={f.note} onChange={set('note')} />
        </Modal>
      )}
      {modal === 'cancel' && (
        <Modal badge="CANCEL DEAL" tone="red" title="Cancel this deal?" onClose={() => setModal(null)} busy={busy} error={err} confirmLabel="Cancel deal" onConfirm={() => act({ action: 'cancel', note: f.note })}>
          <p>The reserved quantity returns to the marketplace and both parties are notified.</p>
          <TextAreaField label="Reason" value={f.note} onChange={set('note')} />
        </Modal>
      )}
      {modal === 'note' && (
        <Modal badge="INTERNAL NOTE" tone="gray" title="Add internal note" onClose={() => setModal(null)} busy={busy} error={err} confirmLabel="Save note" onConfirm={() => act({ action: 'note', text: f.note }, () => setTab('timeline'))}>
          <TextAreaField label="Note (admins only)" value={f.note} onChange={set('note')} />
        </Modal>
      )}
      {(modal === 'pay-buyer' || modal === 'pay-seller') && (
        <Modal badge="CONFIRM PAYMENT" title={modal === 'pay-buyer' ? 'Buyer payment received' : 'Seller payout sent'} onClose={() => setModal(null)} busy={busy} error={err} confirmLabel="Confirm" onConfirm={() => act({ action: 'payment', party: modal === 'pay-buyer' ? 'buyer' : 'seller', reference: f.ref })}>
          <p>Amount: <b>{formatINR(modal === 'pay-buyer' ? d.ledger.buyerAmount : d.ledger.sellerAmount)}</b></p>
          <Field label="Bank / UTR reference" value={f.ref} onChange={set('ref')} />
        </Modal>
      )}
    </DashboardShell>
  )
}
