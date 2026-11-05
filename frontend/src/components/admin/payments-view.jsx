import { useRouter } from '@/lib/router'
import { ArrowRight, WalletCards } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { useFetch } from '@/hooks/use-fetch'
import { DEAL_STATUS_LABEL } from '@/lib/status'
import { formatCompactINR, formatINR } from '@/lib/format'

export function PaymentsView() {
  const router = useRouter()
  const { data, error, loading } = useFetch('/api/admin/payments')
  const t = data?.totals
  return (
    <DashboardShell role="admin" title="Payments" subtitle="Money in from buyers and money out to sellers." active="Payments">
      <div className="metrics-grid">
        <MetricCard icon={<WalletCards size={21} />} label="To collect from buyers" value={t ? formatCompactINR(t.receivable) : '–'} tone="amber" />
        <MetricCard icon={<WalletCards size={21} />} label="To pay sellers" value={t ? formatCompactINR(t.payable) : '–'} tone="blue" />
        <MetricCard icon={<WalletCards size={21} />} label="Revenue settled" value={t ? formatCompactINR(t.revenueSettled) : '–'} />
        <MetricCard icon={<WalletCards size={21} />} label="Revenue in pipeline" value={t ? formatCompactINR(t.revenuePipeline) : '–'} tone="purple" />
      </div>
      <section className="card">
        <PageState loading={loading} error={error}>
          {data?.rows.length === 0 ? (
            <EmptyState title="No payments yet" text="Payments appear once a deal reaches Terms Agreed." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Deal</th><th>Buyer pays</th><th>Seller receives</th><th>Revenue</th><th>Buyer payment</th><th>Seller payout</th><th>Stage</th><th /></tr></thead>
                <tbody>
                  {data?.rows.map((r) => (
                    <tr key={r.id}>
                      <td><b>#{r.ref}</b><br /><small className="muted">{r.listingTitle}</small></td>
                      <td>{formatINR(r.buyerAmount)}<br /><small className="muted">{r.buyer}</small></td>
                      <td>{formatINR(r.sellerAmount)}<br /><small className="muted">{r.seller}</small></td>
                      <td>{formatINR(r.revenue)}</td>
                      <td>{r.buyerPaid ? <Badge tone="green">Received</Badge> : <Badge tone="amber">{r.proofUploaded ? 'Proof uploaded' : 'Pending'}</Badge>}</td>
                      <td>{r.sellerPaid ? <Badge tone="green">Paid</Badge> : <Badge tone="gray">Pending</Badge>}</td>
                      <td>{DEAL_STATUS_LABEL[r.status]}</td>
                      <td><button className="table-action" onClick={() => router.push(`/deal/${r.id}`)}>Open <ArrowRight size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageState>
      </section>
    </DashboardShell>
  )
}
