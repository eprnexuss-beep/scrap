import { ArrowRight } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { useRouter } from '@/lib/router'
import { DEAL_STATUS_LABEL, DEAL_TONE } from '@/lib/status'
import { formatDate, formatPrice, formatQty } from '@/lib/format'

export function BuyerOffersView({ mode = 'offers' }) {
  const deals = mode === 'deals'
  const router = useRouter()
  const { data, error, loading } = useFetch('/api/buyer/offers')
  const rows = (data?.offers ?? []).filter((o) => !deals || o.agreed)

  return (
    <DashboardShell role="buyer" title={deals ? 'My deals' : 'My offers'} subtitle={deals ? 'Agreed deals through to settlement.' : 'Your private offers and their status.'} active={deals ? 'My Deals' : 'My Offers'}>
      <section className="card">
        <div className="card-heading">
          <div><h2>{deals ? 'Agreed deals' : 'All offers'}</h2><p>{data ? `${rows.length} total` : ' '}</p></div>
          <Button onClick={() => router.push('/marketplace')}>Browse lots</Button>
        </div>
        <PageState loading={loading} error={error}>
          {rows.length === 0 ? (
            <EmptyState title={deals ? 'No agreed deals yet' : 'No offers yet'} text={deals ? 'Deals appear here once EPR Nexuss accepts an offer.' : 'Find a lot you like and place a private offer.'} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Offer</th><th>Material</th><th>Latest offer</th><th>Status</th><th>Updated</th><th /></tr></thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id}>
                      <td><b>#{o.offerRef}</b>{o.ref && <><br /><small className="muted">Deal #{o.ref}</small></>}</td>
                      <td><div className="table-material"><img src={o.listing?.cover} alt="" /><span><b>{o.listing?.title ?? 'Listing removed'}</b><br /><small className="muted">{o.listing?.category}</small></span></div></td>
                      <td>{o.latest ? <>{formatPrice(o.latest.pricePerUnit, o.unit)}<br /><small className="muted">{formatQty(o.latest.quantity, o.unit)} · {o.latest.by === 'admin' ? 'EPR Nexuss counter' : 'You'}</small></> : '—'}</td>
                      <td><Badge tone={DEAL_TONE[o.status]}>{DEAL_STATUS_LABEL[o.status]}</Badge></td>
                      <td>{formatDate(o.updatedAt, true)}</td>
                      <td><button className="table-action" onClick={() => router.push(`/buyer/offers/${o.id}`)}>View <ArrowRight size={14} /></button></td>
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
