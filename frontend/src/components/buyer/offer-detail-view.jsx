import { useState } from 'react'
import { useRouter } from '@/lib/router'
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, X } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DealTimeline } from '@/components/shared/deal-timeline'
import { FilePicker } from '@/components/shared/file-picker'
import { PageState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, TextAreaField } from '@/components/ui/field'
import { useFetch } from '@/hooks/use-fetch'
import { api } from '@/lib/api'
import { DEAL_STATUS_LABEL, DEAL_TONE } from '@/lib/status'
import { formatDate, formatINR, formatPrice, formatQty } from '@/lib/format'

export function BuyerOfferDetailView({ id }) {
  const router = useRouter()
  const { data, error, loading, reload } = useFetch(`/api/buyer/offers/${id}`)
  const o = data?.offer
  const [modal, setModal] = useState(false)
  const [f, setF] = useState({ price: '', qty: '', note: '' })
  const [proof, setProof] = useState([])
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))

  const respond = async (json, label) => {
    setErr('')
    setMsg('')
    setBusy(label)
    try {
      await api(`/api/buyer/offers/${id}/respond`, { method: 'POST', json })
      setModal(false)
      await reload()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy('')
    }
  }

  const sendProof = async () => {
    if (!proof.length) return setErr('Choose your payment receipt first.')
    setErr('')
    setMsg('')
    setBusy('proof')
    try {
      const form = new FormData()
      form.append('proof', proof[0])
      await api(`/api/buyer/offers/${id}/proof`, { method: 'POST', form })
      setProof([])
      setMsg('Proof uploaded. EPR Nexuss will confirm your payment shortly.')
      await reload()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy('')
    }
  }

  const last = o?.latest
  const closed = o && ['rejected', 'withdrawn', 'cancelled', 'expired'].includes(o.status)
  const payable = o?.payment && o.payment.status !== 'confirmed' && ['terms_agreed', 'inspection', 'pickup_scheduled', 'delivered'].includes(o.status)

  return (
    <DashboardShell role="buyer" title={o ? `Offer #${o.offerRef}` : 'Offer'} subtitle={o?.ref ? `Deal #${o.ref}` : 'Private negotiation with EPR Nexuss'} active="My Offers">
      <button className="back-link" onClick={() => router.push('/buyer/offers')}><ArrowLeft size={16} /> Back to my offers</button>
      <PageState loading={loading && !data} error={error}>
        {o && (
          <div className="deal-grid">
            <div>
              <section className="card">
                <div className="deal-header" style={{ marginBottom: 14 }}>
                  <div>
                    <Badge tone={DEAL_TONE[o.status]}>{DEAL_STATUS_LABEL[o.status]}</Badge>
                    <h2>{o.listing?.title ?? 'Listing'}</h2>
                    <p>{o.listing?.category} · {[o.listing?.city, o.listing?.state].filter(Boolean).join(', ')} · Placed {formatDate(o.createdAt)}</p>
                  </div>
                </div>
                {err && <div className="form-alert form-alert--danger">{err}</div>}
                {msg && <div className="form-alert form-alert--success">{msg}</div>}
                <div className="offer-history">
                  {o.rounds.map((r, i) => (
                    <div key={r.id} className={i === o.rounds.length - 1 && !closed && !o.agreed ? 'current' : ''}>
                      <span>{i + 1}</span>
                      <div>
                        <small>{r.by === 'buyer' ? 'Your offer' : 'EPR Nexuss counteroffer'} · {formatDate(r.at, true)}</small>
                        <b>{formatPrice(r.pricePerUnit, o.unit)} · {formatQty(r.quantity, o.unit)}</b>
                        {r.note && <p>{r.note}</p>}
                        {i === o.rounds.length - 1 && o.status === 'counteroffer' && (
                          <div>
                            <Button onClick={() => respond({ action: 'accept' }, 'accept')} loading={busy === 'accept'}>Accept counteroffer</Button>
                            <Button variant="secondary" onClick={() => { setF({ price: String(r.pricePerUnit), qty: String(r.quantity), note: '' }); setErr(''); setModal(true) }}>Make a new offer</Button>
                            <Button variant="ghost" onClick={() => respond({ action: 'withdraw' }, 'withdraw')} loading={busy === 'withdraw'}>Withdraw</Button>
                          </div>
                        )}
                        {i === o.rounds.length - 1 && o.status === 'under_review' && (
                          <>
                            <p>Under review by EPR Nexuss.</p>
                            <div><Button variant="ghost" onClick={() => respond({ action: 'withdraw' }, 'withdraw')} loading={busy === 'withdraw'}>Withdraw offer</Button></div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {o.agreed && <div className="form-alert form-alert--success"><CheckCircle2 size={15} /> Terms agreed at <b>{formatPrice(o.agreed.pricePerUnit, o.unit)}</b> for <b>{formatQty(o.agreed.quantity, o.unit)}</b>.</div>}
                {closed && <div className="form-alert form-alert--danger">This offer is {DEAL_STATUS_LABEL[o.status].toLowerCase()}.</div>}
              </section>
              {o.agreed && (
                <section className="card">
                  <div className="card-heading"><div><h2>Fulfilment timeline</h2><p>Track inspection, pickup and settlement.</p></div></div>
                  <DealTimeline timeline={o.timeline} closed={closed} />
                </section>
              )}
            </div>
            <aside>
              {o.payment && (
                <section className="card">
                  <div className="card-heading"><div><h2>Payment</h2><p>Pay EPR Nexuss to release the material.</p></div></div>
                  <div className="pay-block">
                    <div className="pay-block__top"><b>Amount due</b><Badge tone={o.payment.status === 'confirmed' ? 'green' : 'amber'}>{o.payment.status === 'confirmed' ? 'Received' : 'Pending'}</Badge></div>
                    <div className="pay-block__amount">{formatINR(o.payment.amount)}</div>
                    {o.payment.status === 'confirmed' && <small className="muted">Ref {o.payment.reference} · {formatDate(o.payment.confirmedAt, true)}</small>}
                  </div>
                  {payable && (
                    <>
                      <p className="ledger-note">Bank details are shared by your EPR Nexuss account manager. After paying, upload the receipt here.</p>
                      <FilePicker files={proof} onChange={setProof} mode="docs" max={1} buttonLabel={o.payment.proofUploaded ? 'Replace receipt' : 'Select receipt'} />
                      {o.payment.proofUploaded && <p className="ledger-note">A receipt is already uploaded and awaiting confirmation.</p>}
                      {proof.length > 0 && <Button className="btn--full" onClick={sendProof} loading={busy === 'proof'} style={{ marginTop: 10 }}>Upload receipt</Button>}
                    </>
                  )}
                </section>
              )}
              {o.pickup && (
                <section className="card">
                  <div className="card-heading"><div><h2>Pickup details</h2><p>Revealed now that pickup is scheduled.</p></div></div>
                  <div className="party"><span><MapPin size={16} /></span><div><small>LOCATION</small><b>{o.pickup.location || 'To be confirmed'}</b><p>{o.pickup.scheduledFor ? `Scheduled ${formatDate(o.pickup.scheduledFor)}` : 'Date to be confirmed'}</p></div></div>
                  {o.pickup.notes && <p className="ledger-note">{o.pickup.notes}</p>}
                </section>
              )}
              <section className="card">
                <div className="privacy-note"><ShieldCheck size={19} /><p>Seller identity and EPR Nexuss pricing remain private. You only see your own offers and official updates.</p></div>
              </section>
            </aside>
          </div>
        )}
      </PageState>
      {modal && o && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal__head"><div><Badge tone="blue">NEW OFFER</Badge><h2>Respond with a new offer</h2></div><button onClick={() => setModal(false)} aria-label="Close"><X size={20} /></button></div>
            <div className="form-grid">
              <Field label={`Price per ${o.unit}`} type="number" step="any" value={f.price} onChange={set('price')} />
              <Field label={`Quantity (${o.unit})`} type="number" step="any" value={f.qty} onChange={set('qty')} />
              <TextAreaField className="field--full" label="Message (optional)" value={f.note} onChange={set('note')} />
            </div>
            {err && <div className="form-alert form-alert--danger">{err}</div>}
            <div className="modal__actions">
              <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
              <Button loading={busy === 'counter'} onClick={() => respond({ action: 'counter', pricePerUnit: Number(f.price), quantity: Number(f.qty), note: f.note }, 'counter')}>Send offer</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
