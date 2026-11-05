import { publicAsset } from '@/lib/public-asset'

export function Logo({ inverse = false }) {
  return (
    <div className={`brand ${inverse ? 'brand--inverse' : ''}`}>
      <img
        className="brand__logo"
        src={publicAsset('assets/epr-nexuss-logo.png')}
        alt="EPR Nexuss"
      />
      <span>
        EPR <b>Nexuss</b>
      </span>
    </div>
  )
}
