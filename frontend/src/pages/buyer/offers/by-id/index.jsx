import { useParams } from 'react-router-dom'
import { BuyerOfferDetailView } from '@/components/buyer/offer-detail-view'

export default function OfferPage() {
  const { id } = useParams()
  return <BuyerOfferDetailView id={id} />
}
