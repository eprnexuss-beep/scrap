import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatPrice, formatQty } from '@/lib/format'

// `lot` is the buyer-safe listing shape from /api/buyer/listings.
export function LotCard({ lot, onView, onOffer, onSavedChange }) {
  const [saved, setSaved] = useState(!!lot.saved)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    setSaved((s) => !s) // optimistic
    try {
      const res = await api(`/api/buyer/listings/${lot.id}/save`, { method: 'POST' })
      setSaved(res.saved)
      onSavedChange?.(lot.id, res.saved)
    } catch {
      setSaved((s) => !s)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="lot-card">
      <div className="lot-card__image">
        <img src={lot.cover} alt={lot.title} />
        <Badge>{lot.badge}</Badge>
        <button onClick={toggle} className={saved ? 'saved' : ''} aria-label={saved ? 'Remove from saved' : 'Save lot'} aria-pressed={saved}>
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="lot-card__body">
        <span className="eyebrow">{lot.category}</span>
        <h3>{lot.title}</h3>
        <p className="lot-location">{[lot.city, lot.state].filter(Boolean).join(', ')} · Approximate location</p>
        <div className="lot-specs">
          <div>
            <small>Available</small>
            <b>{formatQty(lot.available, lot.unit)}</b>
          </div>
          <div>
            <small>Asking price</small>
            <b>{formatPrice(lot.buyerPrice, lot.unit)}</b>
          </div>
        </div>
        <div className="lot-card__actions">
          <Button variant="secondary" onClick={onView}>
            View details
          </Button>
          <Button onClick={onOffer ?? onView}>Place offer</Button>
        </div>
      </div>
    </article>
  )
}
