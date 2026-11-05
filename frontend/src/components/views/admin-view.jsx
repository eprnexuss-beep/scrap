import { useRouter } from '@/lib/router'
import { Clock3, FileCheck2, FileText, Handshake, ShieldCheck, Users, WalletCards } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DefaultMarginEditor } from '@/components/admin/margin-settings-view'
import { PageState, EmptyState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/ui/metric-card'
import { useFetch } from '@/hooks/use-fetch'
import { formatCompactINR } from '@/lib/format'

const COLORS = ['#087443', '#5aa57b', '#e3a633', '#c6d3cd', '#7454c3', '#2563eb']

export function AdminView() {
  const router = useRouter()
  const { data, error, loading } = useFetch('/api/admin/summary')
  const a = data?.attention
  const m = data?.metrics

  const total = data?.categories.reduce((s, c) => s + c.count, 0) ?? 0
  let acc = 0
  const gradient = total
    ? `conic-gradient(${data.categories.map((c, i) => { const from = acc; acc += (c.count / total) * 100; return `${COLORS[i % COLORS.length]} ${from}% ${acc}%` }).join(', ')})`
    : 'conic-gradient(#e2e8f0 0 100%)'
  const peak = Math.max(1, ...(data?.monthly.map((x) => x.value) ?? [1]))

  const goReview = () => {
    if (a.pendingUsers) router.push('/admin-dashboard/verifications')
    else if (a.pendingListings) router.push('/admin-dashboard/listings')
    else if (a.offersToReview) router.push('/admin-dashboard/offers')
    else router.push('/deal')
  }

  return (
    <DashboardShell role="admin" title="Admin command centre" subtitle="Platform operations, approvals and transaction oversight." active="Dashboard">
      <PageState loading={loading} error={error}>
        {data && (
          <>
            {a.total > 0 ? (
              <div className="admin-alert">
                <span><Clock3 size={21} /></span>
                <div>
                  <b>{a.total} action{a.total === 1 ? '' : 's'} need your attention</b>
                  <p>{a.pendingUsers} account verification{a.pendingUsers === 1 ? '' : 's'}, {a.pendingListings} listing{a.pendingListings === 1 ? '' : 's'}, {a.offersToReview} offer{a.offersToReview === 1 ? '' : 's'} and {a.settlementReviews} settlement review{a.settlementReviews === 1 ? '' : 's'} are pending.</p>
                </div>
                <Button variant="secondary" onClick={goReview}>Open review queue</Button>
              </div>
            ) : (
              <div className="form-alert form-alert--success">You’re all caught up — nothing is waiting for review.</div>
            )}
            <div className="metrics-grid metrics-grid--admin">
              <MetricCard icon={<Users size={21} />} label="Total sellers" value={m.sellers} delta={`+${m.sellersNew} this month`} />
              <MetricCard icon={<ShieldCheck size={21} />} label="Verified recyclers" value={m.recyclers} delta={`+${m.recyclersNew} this month`} tone="blue" />
              <MetricCard icon={<FileText size={21} />} label="Active listings" value={m.activeListings} tone="amber" />
              <MetricCard icon={<Handshake size={21} />} label="Ongoing deals" value={m.ongoingDeals} tone="purple" />
              <MetricCard icon={<WalletCards size={21} />} label="Transaction value" value={formatCompactINR(m.transactionValue)} delta="Agreed terms" />
            </div>
            <div className="admin-grid">
              <section className="card chart-card">
                <div className="card-heading"><div><h2>Transaction value</h2><p>Agreed deal value · last 6 months</p></div></div>
                <div className="bar-chart">
                  {data.monthly.map((x) => (
                    <div key={x.label} title={formatCompactINR(x.value)}>
                      <span style={{ height: `${Math.max(3, (x.value / peak) * 100)}%` }} />
                      <small>{x.label}</small>
                    </div>
                  ))}
                </div>
              </section>
              <section className="card donut-card">
                <div className="card-heading"><div><h2>Category distribution</h2><p>Active listing mix</p></div></div>
                <div className="donut-wrap">
                  <div className="donut" style={{ background: gradient }}><span><b>{total}</b><small>Listings</small></span></div>
                  <div className="legend">
                    {data.categories.length === 0 && <small className="muted">No active listings yet</small>}
                    {data.categories.map((c, i) => (
                      <div key={c.name}><i style={{ background: COLORS[i % COLORS.length] }} /><span>{c.name}</span><b>{Math.round((c.count / total) * 100)}%</b></div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
            <div className="admin-bottom-grid">
              <section className="card">
                <div className="card-heading"><div><h2>Pending approvals</h2><p>Items requiring an administrative decision.</p></div></div>
                {data.queue.length === 0 && <EmptyState title="Queue is empty" text="Approvals will show up here." />}
                {data.queue.map((item, index) => (
                  <div className="approval-row" key={`${item.kind}-${item.id}`}>
                    <span className={`approval-row__icon approval-row__icon--${index % 3}`}><FileCheck2 size={18} /></span>
                    <div><small>{item.type}</small><b>{item.title}</b></div>
                    <Badge tone="amber">{item.status}</Badge>
                    <Button variant="secondary" onClick={() => router.push(item.href)}>Review</Button>
                  </div>
                ))}
              </section>
              <DefaultMarginEditor compact />
            </div>
          </>
        )}
      </PageState>
    </DashboardShell>
  )
}
