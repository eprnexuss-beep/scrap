import { useMemo, useState } from 'react'
import { useRouter } from '@/lib/router'
import { ArrowRight, Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { useFetch } from '@/hooks/use-fetch'
import { DEAL_TONE, DEAL_STATUS_LABEL } from '@/lib/status'
import { formatDate, formatINR, formatPrice, formatQty } from '@/lib/format'

// One list component, two sidebar pages:
//   offers → "Offers & Enquiries": private offers still being negotiated (or closed without a deal)
//   deals  → "Deals & Negotiations": agreed deals moving through fulfilment and settlement
const MODES = {
  offers: {
    title: 'Offers & enquiries',
    subtitle: 'Private offers from verified recyclers waiting for a decision or reply.',
    active: 'Offers & Enquiries',
    groups: [['negotiating', 'Open offers'], ['offerclosed', 'Closed offers']],
    empty: ['No offers here', 'Offers from recyclers will appear as they come in.'],
  },
  deals: {
    title: 'Deals & negotiations',
    subtitle: 'Agreed deals through inspection, pickup, delivery and settlement.',
    active: 'Deals & Negotiations',
    groups: [['live', 'In progress'], ['settled', 'Settled'], ['cancelled', 'Cancelled']],
    empty: ['No deals here', 'Deals appear once an offer is accepted.'],
  },
}

export function DealsListView({ mode = 'deals' }) {
  const router = useRouter()
  const cfg = MODES[mode]
  const [group, setGroup] = useState(cfg.groups[0][0])
  const [query, setQuery] = useState('')
  const path = useMemo(() => `/api/admin/deals?group=${group}${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''}`, [group, query])
  const { data, error, loading } = useFetch(path)

  return (
    <DashboardShell role="admin" title={cfg.title} subtitle={cfg.subtitle} active={cfg.active}>
      <div className="filter-chips">
        {cfg.groups.map(([key, label]) => (
          <button key={key} className={group === key ? 'active' : ''} onClick={() => setGroup(key)}>
            {label}{data ? ` (${data.counts[key]})` : ''}
          </button>
        ))}
      </div>
      <section className="card">
        <div className="card-heading">
          <div><h2>{cfg.groups.find((g) => g[0] === group)[1]}</h2><p>Buyer and seller identities are visible to admins only.</p></div>
          <div className="table-tools">
            <label><Search size={16} /><input placeholder="Search deal, lot or company" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          </div>
        </div>
        <PageState loading={loading && !data} error={error}>
          {data?.deals.length === 0 ? (
            <EmptyState title={cfg.empty[0]} text={cfg.empty[1]} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>{mode === 'offers' ? 'Offer' : 'Deal'}</th><th>Material</th><th>Parties</th><th>Latest offer</th><th>Revenue</th><th>Status</th><th>Updated</th><th /></tr></thead>
                <tbody>
                  {data?.deals.map((d) => (
                    <tr key={d.id}>
                      <td><b>#{mode === 'offers' ? d.offerRef : d.ref}</b><br /><small className="muted">{mode === 'offers' ? `Deal #${d.ref}` : d.offerRef}</small></td>
                      <td>{d.listingTitle}<br /><small className="muted">{d.category}</small></td>
                      <td>{d.buyer}<br /><small className="muted">from {d.seller}</small></td>
                      <td>{d.latest ? <>{formatPrice(d.latest.pricePerUnit, d.unit)}<br /><small className="muted">{formatQty(d.latest.quantity, d.unit)} · {d.latest.by === 'buyer' ? 'Buyer' : 'Admin'} · {d.rounds} round{d.rounds === 1 ? '' : 's'}</small></> : '—'}</td>
                      <td>{formatINR(d.revenue)}</td>
                      <td><Badge tone={DEAL_TONE[d.status]}>{d.status === 'under_review' && d.rounds > 1 ? 'Under negotiation' : DEAL_STATUS_LABEL[d.status]}</Badge></td>
                      <td>{formatDate(d.updatedAt)}</td>
                      <td><button className="table-action" onClick={() => router.push(`/deal/${d.id}`)}>Open <ArrowRight size={14} /></button></td>
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
