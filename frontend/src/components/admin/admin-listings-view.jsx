import { useMemo, useState } from 'react'
import { useRouter } from '@/lib/router'
import { ArrowRight, Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { useFetch } from '@/hooks/use-fetch'
import { LISTING_STATUS_LABEL } from '@/lib/constants'
import { listingBadge } from '@/lib/status'
import { formatPrice, formatQty } from '@/lib/format'

const TABS = ['pending', 'active', 'negotiation', 'rejected', 'sold', 'closed']

export function AdminListingsView() {
  const router = useRouter()
  const [status, setStatus] = useState('pending')
  const [query, setQuery] = useState('')
  const path = useMemo(() => `/api/admin/listings?status=${status}${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''}`, [status, query])
  const { data, error, loading } = useFetch(path)

  return (
    <DashboardShell role="admin" title="Listings" subtitle="Review seller submissions and manage live lots." active="Listings">
      <div className="filter-chips">
        {TABS.map((t) => (
          <button key={t} className={status === t ? 'active' : ''} onClick={() => setStatus(t)}>
            {LISTING_STATUS_LABEL[t]}{data?.counts?.[t] != null ? ` (${data.counts[t]})` : ''}
          </button>
        ))}
      </div>
      <section className="card">
        <div className="card-heading">
          <div><h2>{LISTING_STATUS_LABEL[status]} listings</h2><p>Seller identity and private prices are visible to admins only.</p></div>
          <div className="table-tools">
            <label><Search size={16} /><input placeholder="Search listings" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          </div>
        </div>
        <PageState loading={loading} error={error}>
          {data?.listings.length === 0 ? (
            <EmptyState title="No listings here" text="Nothing matches this status yet." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Material</th><th>Seller</th><th>Quantity</th><th>Seller price</th><th>Buyer price</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {data?.listings.map((l) => {
                    const b = listingBadge(l.status)
                    return (
                      <tr key={l.id}>
                        <td><div className="table-material"><img src={l.cover} alt="" /><span><b>{l.title}</b><br /><small className="muted">{l.ref} · {l.category}</small></span></div></td>
                        <td>{l.sellerName}</td>
                        <td>{formatQty(l.quantity, l.unit)}</td>
                        <td>{formatPrice(l.sellerPrice, l.unit)}</td>
                        <td>{l.buyerPrice ? formatPrice(l.buyerPrice, l.unit) : '—'}</td>
                        <td><Badge tone={b.tone}>{b.label}</Badge></td>
                        <td><button className="table-action" onClick={() => router.push(`/admin-dashboard/listings/${l.id}`)}>{l.status === 'pending' ? 'Review' : 'View'} <ArrowRight size={14} /></button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PageState>
      </section>
    </DashboardShell>
  )
}
