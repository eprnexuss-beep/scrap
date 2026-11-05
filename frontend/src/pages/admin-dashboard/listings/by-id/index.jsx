import { useParams } from 'react-router-dom'
import { AdminListingDetail } from '@/components/admin/admin-listing-detail'

export default function AdminListingPage() {
  const { id } = useParams()
  return <AdminListingDetail id={id} />
}
