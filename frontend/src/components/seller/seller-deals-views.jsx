import { MessageSquareText, ShieldCheck } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DealTimeline } from '@/components/shared/deal-timeline'
import { PageState, EmptyState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { useFetch } from '@/hooks/use-fetch'
import { DEAL_STATUS_LABEL, DEAL_TONE } from '@/lib/status'
import { formatCompactINR, formatDate, formatINR, formatQty } from '@/lib/format'

export function SellerEnquiriesView() {
  const { data, error, loading } = useFetch('/api/seller/enquiries')
  const tone = { Open: 'amber', 'Deal agreed': 'green', Closed: 'gray' }
  return (
    <DashboardShell role="seller" title="Enquiries" subtitle="Interest from verified recyclers on your listings." active="Enquiries">
      <section className="card">
        <div className="card-heading"><div><h2>Buyer enquiries</h2><p>Buyer identities and offer prices are handled by EPR Nexuss on your behalf.</p></div></div>
        <PageState loading={loading} error={error}>
          {data?.enquiries.length === 0 ? (
            <EmptyState title="No enquiries yet" text="When a verified recycler is interested in one of your approved lots, it shows up here." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Listing</th><th>Requested quantity</th><th>Received</th><th>Status</th></tr></thead>
                <tbody>
                  {data?.enquiries.map((e) => (
                    <tr key={e.id}>
                      <td><b>{e.listing?.title}</b><br /><small className="muted">{e.listing?.ref} · from a verified recycler</small></td>
                      <td>{formatQty(e.requestedQuantity, e.unit)}</td>
                      <td>{formatDate(e.createdAt, true)}</td>
                      <td><Badge tone={tone[e.state]}>{e.state}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageState>
      </section>
      <div className="privacy-note"><ShieldCheck size={19} /><p>You are always paid your own listed price for the weighed quantity — EPR Nexuss handles negotiation, inspection and payment collection.</p></div>
    </DashboardShell>
  )
}

export function SellerDealsView({ mode = 'deals' }) {
  const settlements = mode === 'settlements'
  const { data, error, loading } = useFetch('/api/seller/deals')
  return (
    <DashboardShell
      role="seller"
      title={settlements ? 'Settlements' : 'Deals'}
      subtitle={settlements ? 'What you have been paid and what is on its way.' : 'Agreed deals and their fulfilment progress.'}
      active={settlements ? 'Settlements' : 'Deals'}
    >
      {settlements && data && (
        <div className="metrics-grid">
          <MetricCard icon={<MessageSquareText size={21} />} label="Paid out" value={formatCompactINR(data.totals.paid)} />
          <MetricCard icon={<MessageSquareText size={21} />} label="Pending settlement" value={formatCompactINR(data.totals.pending)} tone="amber" />
        </div>
      )}
      <PageState loading={loading} error={error}>
        {data?.deals.length === 0 ? (
          <section className="card"><EmptyState title={settlements ? 'No settlements yet' : 'No deals yet'} text="Deals appear here once EPR Nexuss agrees terms with a buyer on your lot." /></section>
        ) : settlements ? (
          <section className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Deal</th><th>Material</th><th>Quantity</th><th>Your settlement</th><th>Payout</th></tr></thead>
                <tbody>
                  {data?.deals.map((d) => (
                    <tr key={d.id}>
                      <td><b>#{d.ref}</b></td>
                      <td>{d.listing?.title}</td>
                      <td>{formatQty(d.quantity, d.unit)}</td>
                      <td><b>{formatINR(d.sellerAmount)}</b></td>
                      <td>{d.payout.status === 'confirmed' ? <><Badge tone="green">Paid</Badge><br /><small className="muted">Ref {d.payout.reference} · {formatDate(d.payout.confirmedAt)}</small></> : <Badge tone="amber">{d.status === 'cancelled' ? 'Cancelled' : 'Pending'}</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          data?.deals.map((d) => (
            <section className="card" key={d.id}>
              <div className="card-heading">
                <div><h2>{d.listing?.title}</h2><p>Deal #{d.ref} · {formatQty(d.quantity, d.unit)} · You receive {formatINR(d.sellerAmount)}</p></div>
                <Badge tone={DEAL_TONE[d.status]}>{DEAL_STATUS_LABEL[d.status]}</Badge>
              </div>
              <DealTimeline timeline={d.timeline} closed={d.status === 'cancelled'} />
              {d.pickupScheduledFor && <p className="ledger-note">Pickup scheduled for {formatDate(d.pickupScheduledFor)}. An EPR Nexuss coordinator will contact you.</p>}
            </section>
          ))
        )}
      </PageState>
    </DashboardShell>
  )
}
