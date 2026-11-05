import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'

export function AuditView() {
  const [q, setQ] = useState('')
  const [entries, setEntries] = useState([])
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (append = false, search = q) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (search.trim()) p.set('q', search.trim())
      if (append && entries.length) p.set('before', entries[entries.length - 1].at)
      const data = await api(`/api/admin/audit?${p}`)
      setEntries((cur) => (append ? [...cur, ...data.entries] : data.entries))
      setMore(data.more)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(false, q), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <DashboardShell role="admin" title="Audit log" subtitle="Every sensitive action on the platform, newest first." active="Audit Log">
      <section className="card">
        <div className="card-heading">
          <div><h2>Activity</h2><p>Approvals, pricing, offers, payments and sign-ins.</p></div>
          <div className="table-tools"><label><Search size={16} /><input placeholder="Filter by action or text" value={q} onChange={(e) => setQ(e.target.value)} /></label></div>
        </div>
        <PageState loading={loading && !entries.length} error={error}>
          {entries.length === 0 ? <EmptyState title="No activity found" text="Try a different filter." /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td>{formatDate(e.at, true)}</td>
                      <td>{e.actor}<br /><small className="muted">{e.role}</small></td>
                      <td><code>{e.action}</code></td>
                      <td>{e.summary || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageState>
        {more && <div style={{ textAlign: 'center', marginTop: 14 }}><Button variant="secondary" onClick={() => load(true)} loading={loading}>Load more</Button></div>}
      </section>
    </DashboardShell>
  )
}
