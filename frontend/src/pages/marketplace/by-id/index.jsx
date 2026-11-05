import { useParams } from 'react-router-dom'
import { LotDetailView } from '@/components/buyer/lot-detail-view'

export default function LotPage() {
  const { id } = useParams()
  return <LotDetailView id={id} />
}
