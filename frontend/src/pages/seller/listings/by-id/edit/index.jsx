import { useParams } from 'react-router-dom'
import { EditListingView } from '@/components/seller/edit-listing-view'

export default function EditListingPage() {
  const { id } = useParams()
  return <EditListingView id={id} />
}
