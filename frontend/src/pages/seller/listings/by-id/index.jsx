import { useParams } from 'react-router-dom'
import { SellerListingDetailView } from '@/components/seller/listing-detail-view'

export default function SellerListingPage() {
  const { id } = useParams()
  return <SellerListingDetailView id={id} />
}
