import { useRouter } from '@/lib/router'
import { ArrowRight, CheckCircle2, ShieldCheck, ShoppingBag, Tag, WalletCards, Handshake } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { useAuth } from '@/components/providers/auth-provider'
import { EmptyState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LotCard } from '@/components/ui/lot-card'
import { MetricCard } from '@/components/ui/metric-card'
import { useFetch } from '@/hooks/use-fetch'
import { DEAL_STATUS_LABEL, DEAL_TONE } from '@/lib/status'
import { formatCompactINR, timeAgo } from '@/lib/format'

export function BuyerView() {
  const router = useRouter()
  const { user } = useAuth()
  const summary = useFetch('/api/buyer/summary')
  const lots = useFetch('/api/buyer/listings?sort=newest')
  const offers = useFetch('/api/buyer/offers')
  const s = summary.data
  const verified = s?.verified

  return (
    <DashboardShell role="buyer" title={`Welcome, ${user?.companyName ?? ''}`} subtitle="Fresh verified lots matched to your authorized categories.">
      <div className="dashboard-banner dashboard-banner--buyer">
        <div>
          {verified && <Badge><ShieldCheck size={14} /> VERIFIED RECYCLER</Badge>}
          <h2>
            {!s ? 'Loading your matches…' : !verified ? 'Your marketplace access is being set up' : s.matching === 0 ? 'No new lots match your profile yet' : `${s.matching} lot${s.matching === 1 ? '' : 's'} match your processing profile`}
          </h2>
          <p>{verified ? 'Review new approved supply before offer windows close.' : 'Lots in your authorised categories unlock once EPR Nexuss verifies your documents.'}</p>
        </div>
        <Button onClick={() => router.push('/marketplace')}>
          Browse matching lots <ArrowRight size={16} />
        </Button>
      </div>
      <div className="metrics-grid">
        <MetricCard icon={<ShoppingBag size={21} />} label="New matching lots" value={s?.matching ?? '–'} delta={s ? `+${s.today} today` : ''} />
        <MetricCard icon={<Tag size={21} />} label="Active offers" value={s?.activeOffers ?? '–'} tone="blue" />
        <MetricCard icon={<CheckCircle2 size={21} />} label="Won deals" value={s?.won ?? '–'} tone="amber" />
        <MetricCard icon={<WalletCards size={21} />} label="Total purchase value" value={s ? formatCompactINR(s.purchaseValue) : '–'} tone="purple" />
      </div>
      <section className="card">
        <div className="card-heading">
          <div><h2>Recommended lots for you</h2><p>Approved listings in your verified material categories.</p></div>
          <Button variant="ghost" onClick={() => router.push('/marketplace')}>View marketplace <ArrowRight size={16} /></Button>
        </div>
        {lots.data?.listings.length ? (
          <div className="lot-grid">
            {lots.data.listings.slice(0, 3).map((lot) => (
              <LotCard lot={lot} key={lot.id} onView={() => router.push(`/marketplace/${lot.id}`)} />
            ))}
          </div>
        ) : (
          <EmptyState title="No lots to show yet" text={verified ? 'New approved lots will appear here.' : 'Available after verification.'} />
        )}
      </section>
      <div className="two-column">
        <section className="card">
          <div className="card-heading"><div><h2>Offer activity</h2><p>Your latest private offers.</p></div></div>
          {offers.data?.offers.length === 0 && <EmptyState title="No offers yet" text="Offers you place will be tracked here." />}
          {offers.data?.offers.slice(0, 4).map((o) => (
            <div className="activity-row" key={o.id}>
              <span className="activity-icon"><Tag size={17} /></span>
              <div><b>{o.listing?.title ?? 'Listing'}</b><small>#{o.offerRef} · Updated {timeAgo(o.updatedAt)}</small></div>
              <Badge tone={DEAL_TONE[o.status]}>{DEAL_STATUS_LABEL[o.status]}</Badge>
            </div>
          ))}
        </section>
        <section className="card">
          <div className="card-heading"><div><h2>Compliance status</h2><p>Authorization health.</p></div></div>
          <div className="compliance-score">
            <span><ShieldCheck size={29} /></span>
            <div>
              <b>{verified ? 'All documents verified' : s?.verificationStatus === 'rejected' ? 'Verification not approved' : 'Documents under review'}</b>
              <p>
                {verified
                  ? `Your ${s.categories.join(' and ')} authorizations are active.`
                  : `${s?.documents ?? 0} document(s) submitted. We'll notify you as soon as the review is complete.`}
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
