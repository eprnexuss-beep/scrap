import { useMemo, useState } from 'react'
import { useRouter } from '@/lib/router'
import { Plus, Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { ListingsTable } from '@/components/seller/listings-table'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { LISTING_STATUS_LABEL } from '@/lib/constants'

export function SellerListingsView() {
  const router = useRouter()
  const { data, error, loading } = useFetch('/api/seller/listings')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo(
    () =>
      (data?.listings ?? []).filter(
        (r) =>
          (!status || r.status === status) &&
          (!query || `${r.title} ${r.ref} ${r.category}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [data, query, status],
  )

  return (
    <DashboardShell role="seller" title="My listings" subtitle="Manage drafts, pending approvals and active scrap lots." active="My Listings">
      <section className="card">
        <div className="card-heading">
          <div>
            <h2>All listings</h2>
            <p>{data ? `${data.listings.length} total` : ' '}</p>
          </div>
          <div className="table-tools">
            <label>
              <Search size={16} />
              <input placeholder="Search listings" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <select className="btn btn--secondary" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {Object.entries(LISTING_STATUS_LABEL).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <Button onClick={() => router.push('/seller/listings/new')}>
              <Plus size={16} /> Create listing
            </Button>
          </div>
        </div>
        <PageState loading={loading} error={error}>
          {rows.length === 0 ? (
            <EmptyState
              title={data?.listings.length ? 'No listings match your filters' : 'No listings yet'}
              text={data?.listings.length ? 'Try a different search or status.' : 'Create your first scrap listing to get started.'}
            />
          ) : (
            <ListingsTable rows={rows} onOpen={(row) => router.push(`/seller/listings/${row.id}`)} />
          )}
        </PageState>
      </section>
    </DashboardShell>
  )
}
