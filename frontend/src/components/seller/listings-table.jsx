import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { listingBadge } from '@/lib/status'
import { formatPrice, formatQty } from '@/lib/format'

export function ListingsTable({ rows, onOpen }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Quantity</th>
            <th>Your price</th>
            <th>Status</th>
            <th>Enquiries</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const badge = listingBadge(row.status)
            return (
              <tr key={row.id}>
                <td>
                  <div className="table-material">
                    <img src={row.cover} alt="" />
                    <b>{row.title}</b>
                  </div>
                </td>
                <td>{formatQty(row.quantity, row.unit)}</td>
                <td>{row.sellerPrice ? formatPrice(row.sellerPrice, row.unit) : '—'}</td>
                <td>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </td>
                <td>{row.enquiries}</td>
                <td>
                  <button className="table-action" onClick={() => onOpen(row)}>
                    View details <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
