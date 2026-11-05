import { useMemo, useState } from 'react'
import { useRouter } from '@/lib/router'
import { CheckCircle2, FileText, Handshake, MessageSquareText, Plus, Search, WalletCards } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { useAuth } from '@/components/providers/auth-provider'
import { PageState, EmptyState } from '@/components/shared/state'
import { ListingsTable } from '@/components/seller/listings-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/ui/metric-card'
import { useFetch } from '@/hooks/use-fetch'
import { formatCompactINR } from '@/lib/format'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function SellerView() {
  const router = useRouter()
  const { user } = useAuth()
  const summary = useFetch('/api/seller/summary')
  const listings = useFetch('/api/seller/listings')
  const [query, setQuery] = useState('')
  const s = summary.data
  const verified = user?.verificationStatus === 'approved'

  const rows = useMemo(
    () =>
      (listings.data?.listings ?? [])
        .filter((r) => !query || `${r.title} ${r.ref}`.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6),
    [listings.data, query],
  )

  return (
    <DashboardShell
      role="seller"
      title={`${greeting()}, ${user?.companyName ?? ''}`}
      subtitle="Here’s what’s happening with your scrap business today."
    >
      <div className="dashboard-banner">
        <div>
          {verified && (
            <Badge>
              <CheckCircle2 size={14} /> VERIFIED SELLER
            </Badge>
          )}
          <h2>Ready to turn your next scrap lot into value?</h2>
          <p>Create a verified listing in under five minutes.</p>
        </div>
        <Button onClick={() => router.push('/seller/listings/new')}>
          <Plus size={17} /> Create listing
        </Button>
      </div>
      <div className="metrics-grid">
        <MetricCard icon={<FileText size={21} />} label="Active listings" value={s?.activeListings ?? '–'} delta={s ? `${s.pendingListings} pending approval` : ''} />
        <MetricCard icon={<MessageSquareText size={21} />} label="Total enquiries" value={s?.enquiries ?? '–'} delta={s ? `+${s.weekEnquiries} this week` : ''} tone="blue" />
        <MetricCard icon={<Handshake size={21} />} label="Ongoing deals" value={s?.ongoing ?? '–'} tone="amber" />
        <MetricCard icon={<WalletCards size={21} />} label="Settlement summary" value={s ? formatCompactINR(s.settlement.total) : '–'} delta={s ? `${formatCompactINR(s.settlement.pending)} pending` : ''} tone="purple" />
      </div>
      <section className="card">
        <div className="card-heading">
          <div>
            <h2>Recent listings</h2>
            <p>Manage your active and submitted scrap lots.</p>
          </div>
          <div className="table-tools">
            <label>
              <Search size={16} />
              <input placeholder="Search listings" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <Button variant="secondary" onClick={() => router.push('/seller/listings')}>
              View all
            </Button>
          </div>
        </div>
        <PageState loading={listings.loading} error={listings.error}>
          {rows.length === 0 ? (
            <EmptyState
              title="No listings yet"
              text="Create your first scrap listing and it will appear here."
              action={<Button onClick={() => router.push('/seller/listings/new')}><Plus size={16} /> Create listing</Button>}
            />
          ) : (
            <ListingsTable rows={rows} onOpen={(row) => router.push(`/seller/listings/${row.id}`)} />
          )}
        </PageState>
      </section>
    </DashboardShell>
  )
}
