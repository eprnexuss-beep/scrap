import { useParams } from 'react-router-dom'
import { DealDetailView } from '@/components/admin/deal-detail-view'

export default function DealPage() {
  const { id } = useParams()
  return <DealDetailView id={id} />
}
