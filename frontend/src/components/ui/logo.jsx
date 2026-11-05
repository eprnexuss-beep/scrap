export function Logo({ inverse = false }) {
  return (
    <div className={`brand ${inverse ? 'brand--inverse' : ''}`}>
      <img
        className="brand__logo"
        src="/assets/epr-nexuss-logo.png"
        alt="EPR Nexuss"
      />
      <span>
        EPR <b>Nexuss</b>
      </span>
    </div>
  )
}
