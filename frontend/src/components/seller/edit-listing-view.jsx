import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState } from '@/components/shared/state'
import { ListingForm } from '@/components/seller/listing-form'
import { useFetch } from '@/hooks/use-fetch'

export function EditListingView({ id }) {
  const { data, error, loading } = useFetch(`/api/seller/listings/${id}`)
  if (loading || error) {
    return (
      <DashboardShell role="seller" title="Edit listing" subtitle="" active="My Listings">
        <PageState loading={loading} error={error} />
      </DashboardShell>
    )
  }
  return <ListingForm listing={data.listing} />
}
