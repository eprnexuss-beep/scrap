import { useState } from 'react'
import { useRouter } from '@/lib/router'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { Button } from '@/components/ui/button'
import { LotCard } from '@/components/ui/lot-card'
import { useFetch } from '@/hooks/use-fetch'

export function SavedLotsView() {
  const router = useRouter()
  const { data, error, loading } = useFetch('/api/buyer/saved')
  const [removed, setRemoved] = useState([])
  const lots = (data?.listings ?? []).filter((l) => !removed.includes(l.id))

  return (
    <DashboardShell role="buyer" title="Saved listings" subtitle="Lots you’re keeping an eye on." active="Saved Listings">
      <PageState loading={loading} error={error}>
        {lots.length === 0 ? (
          <section className="card">
            <EmptyState title="Nothing saved yet" text="Tap the heart on any lot to keep it here." action={<Button onClick={() => router.push('/marketplace')}>Browse lots</Button>} />
          </section>
        ) : (
          <div className="lot-grid lot-grid--market">
            {lots.map((lot) => (
              <LotCard key={lot.id} lot={lot} onView={() => router.push(`/marketplace/${lot.id}`)} onSavedChange={(id, saved) => !saved && setRemoved((r) => [...r, id])} />
            ))}
          </div>
        )}
      </PageState>
    </DashboardShell>
  )
}
