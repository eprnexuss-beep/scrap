export function PageState({ loading, error, children }) {
  if (loading) return <div className="page-state">Loading…</div>
  if (error) return <div className="page-state form-alert form-alert--danger">{error}</div>
  return children
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <b>{title}</b>
      {text}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  )
}
