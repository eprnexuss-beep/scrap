export function MetricCard({ icon, label, value, delta, tone = 'green' }) {
  return (
    <article className="metric-card">
      <span className={`metric-card__icon metric-card__icon--${tone}`}>{icon}</span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        {delta && <em>{delta}</em>}
      </div>
    </article>
  )
}
