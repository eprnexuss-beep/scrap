import { BarChart3, Handshake, Percent, WalletCards } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState } from '@/components/shared/state'
import { MetricCard } from '@/components/ui/metric-card'
import { useFetch } from '@/hooks/use-fetch'
import { DEAL_STATUS_LABEL } from '@/lib/status'
import { formatCompactINR, formatINR, formatNumber } from '@/lib/format'

export function ReportsView() {
  const { data, error, loading } = useFetch('/api/admin/reports')
  const t = data?.totals
  const peak = Math.max(1, ...(data?.months.map((m) => m.gmv) ?? [1]))
  return (
    <DashboardShell role="admin" title="Reports & analytics" subtitle="Transaction value, revenue and deal performance." active="Reports & Analytics">
      <PageState loading={loading} error={error}>
        {data && (
          <>
            <div className="metrics-grid">
              <MetricCard icon={<WalletCards size={21} />} label="Gross transaction value" value={formatCompactINR(t.gmv)} />
              <MetricCard icon={<BarChart3 size={21} />} label="Platform revenue" value={formatCompactINR(t.revenue)} delta={`${formatCompactINR(t.settledRevenue)} settled`} tone="blue" />
              <MetricCard icon={<Handshake size={21} />} label="Deals won" value={t.deals} delta={`${t.conversion}% of ${t.offers} offers`} tone="amber" />
              <MetricCard icon={<Percent size={21} />} label="Average take rate" value={`${t.avgMargin}%`} delta={`${formatNumber(Math.round(t.volume))} units traded`} tone="purple" />
            </div>
            <div className="admin-grid">
              <section className="card chart-card">
                <div className="card-heading"><div><h2>Monthly transaction value</h2><p>Deals by month terms were agreed</p></div></div>
                <div className="bar-chart">
                  {data.months.map((m) => (
                    <div key={m.label} title={`${formatINR(m.gmv)} · revenue ${formatINR(m.revenue)} · ${m.deals} deals`}>
                      <span style={{ height: `${Math.max(3, (m.gmv / peak) * 100)}%` }} />
                      <small>{m.label}</small>
                    </div>
                  ))}
                </div>
              </section>
              <section className="card">
                <div className="card-heading"><div><h2>Offer funnel</h2><p>All offers by current status</p></div></div>
                {Object.entries(data.funnel).length === 0 && <p className="muted">No offers yet.</p>}
                {Object.entries(data.funnel).map(([k, n]) => <div className="activity-row" key={k}><div><b>{DEAL_STATUS_LABEL[k] ?? k}</b></div><b>{n}</b></div>)}
              </section>
            </div>
            <div className="reports-grid">
              <section className="card">
                <div className="card-heading"><div><h2>By category</h2></div></div>
                <div className="table-wrap"><table><thead><tr><th>Category</th><th>Deals</th><th>Value</th><th>Revenue</th></tr></thead><tbody>
                  {data.categories.length === 0 && <tr><td colSpan="4" className="muted">No deals yet</td></tr>}
                  {data.categories.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.deals}</td><td>{formatINR(c.gmv)}</td><td>{formatINR(c.revenue)}</td></tr>)}
                </tbody></table></div>
              </section>
              <section className="card">
                <div className="card-heading"><div><h2>Top counterparties</h2></div></div>
                <div className="table-wrap"><table><thead><tr><th>Company</th><th>Role</th><th>Deals</th><th>Value</th></tr></thead><tbody>
                  {[...data.topBuyers.map((x) => ({ ...x, role: 'Buyer' })), ...data.topSellers.map((x) => ({ ...x, role: 'Seller' }))].map((x) => <tr key={x.role + x.name}><td>{x.name}</td><td>{x.role}</td><td>{x.deals}</td><td>{formatINR(x.value)}</td></tr>)}
                </tbody></table></div>
              </section>
            </div>
          </>
        )}
      </PageState>
    </DashboardShell>
  )
}
