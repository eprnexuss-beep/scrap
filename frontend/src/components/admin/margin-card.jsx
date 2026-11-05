import { EyeOff, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { marginAmount, buyerPriceFor } from '@/lib/pricing'
import { formatINR } from '@/lib/format'

/** Controlled margin calculator: base price + margin = buyer-facing price. */
export function MarginCard({ base, unit = 'MT', type, value, onType, onValue, title = 'Margin calculator', subtitle = 'Internal figures · Authorized admins only', baseLabel = 'Seller base price', children }) {
  const amount = marginAmount(base, type, value)
  const final = buyerPriceFor(base, type, value)

  return (
    <section className="card margin-card">
      <div className="card-heading">
        <div>
          <Badge>CORE PRICING CONTROL</Badge>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <ShieldCheck size={23} />
      </div>
      <div className="segmented segmented--margin">
        <button type="button" className={type === 'fixed' ? 'active' : ''} onClick={() => onType('fixed')}>
          Fixed / unit
        </button>
        <button type="button" className={type === 'percentage' ? 'active' : ''} onClick={() => onType('percentage')}>
          Percentage
        </button>
      </div>
      <div className="price-equation">
        <div>
          <small>{baseLabel}</small>
          <b>{formatINR(base)}/{unit}</b>
        </div>
        <span>+</span>
        <div>
          <small>EPR Nexuss margin</small>
          <b>{type === 'fixed' ? `${formatINR(amount)}/${unit}` : `${value || 0}% (${formatINR(amount)})`}</b>
        </div>
        <span>=</span>
        <div className="price-equation__final">
          <small>Buyer-facing price</small>
          <b>{formatINR(final)}/{unit}</b>
        </div>
      </div>
      <label className="field">
        <span>{type === 'fixed' ? 'Margin amount per unit' : 'Margin percentage on seller base price'}</span>
        <div className="field__control">
          <input value={value} onChange={(e) => onValue(e.target.value)} type="number" min="0" step="any" aria-label="Margin value" />
        </div>
      </label>
      {type === 'percentage' && Number(value) > 100 && (
        <em className="field__error" style={{ display: 'block', marginBottom: 12 }}>Percentage margin can’t exceed 100%.</em>
      )}
      {Number(value) < 0 && <em className="field__error" style={{ display: 'block', marginBottom: 12 }}>Margin can’t be negative.</em>}
      {children}
      <div className="privacy-note">
        <EyeOff size={18} />
        <p>Buyers see only the final asking price. The seller base price and internal margin are never disclosed.</p>
      </div>
    </section>
  )
}
