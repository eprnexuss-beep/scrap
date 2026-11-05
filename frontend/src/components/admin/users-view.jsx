import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { UserReviewModal, STATUS_TONE } from '@/components/admin/user-review-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { VERIFICATION_LABEL } from '@/lib/constants'
import { formatDate } from '@/lib/format'

// mode "verifications": pending queue.  mode "users": everyone, with filters.
export function UsersView({ mode = 'users' }) {
  const queue = mode === 'verifications'
  const [role, setRole] = useState('')
  const [status, setStatus] = useState(queue ? 'pending' : '')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const path = useMemo(() => {
    const p = new URLSearchParams()
    if (role) p.set('role', role)
    if (status) p.set('status', status)
    if (query.trim()) p.set('q', query.trim())
    return `/api/admin/users?${p}`
  }, [role, status, query])
  const { data, error, loading, reload } = useFetch(path)

  return (
    <DashboardShell
      role="admin"
      title={queue ? 'Verifications' : 'Users'}
      subtitle={queue ? 'Review company documents before granting marketplace access.' : 'All registered sellers and recyclers.'}
      active={queue ? 'Verifications' : 'Users'}
    >
      <section className="card">
        <div className="card-heading">
          <div>
            <h2>{queue ? 'Pending verification' : 'Registered companies'}</h2>
            <p>{data ? `${data.users.length} shown` : ' '}</p>
          </div>
          <div className="table-tools">
            <label>
              <Search size={16} />
              <input placeholder="Search company, email, GSTIN" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <select className="btn btn--secondary" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by type">
              <option value="">All types</option>
              <option value="seller">Sellers</option>
              <option value="buyer">Recyclers</option>
            </select>
            {!queue && (
              <select className="btn btn--secondary" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                <option value="">All statuses</option>
                {Object.entries(VERIFICATION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            )}
          </div>
        </div>
        <PageState loading={loading} error={error}>
          {data?.users.length === 0 ? (
            <EmptyState title={queue ? 'Nothing waiting for review' : 'No users found'} text={queue ? 'New registrations will appear here.' : 'Try a different filter.'} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Company</th><th>Type</th><th>Contact</th><th>GSTIN</th><th>Registered</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {data?.users.map((u) => (
                    <tr key={u.id}>
                      <td><b>{u.companyName}</b><br /><small className="muted">{u.city}</small></td>
                      <td>{u.role === 'buyer' ? 'Recycler' : 'Seller'}</td>
                      <td>{u.contactPerson}<br /><small className="muted">{u.email}</small></td>
                      <td>{u.gstin || '—'}</td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td><Badge tone={STATUS_TONE[u.verificationStatus]}>{VERIFICATION_LABEL[u.verificationStatus]}</Badge></td>
                      <td><Button variant="secondary" onClick={() => setOpenId(u.id)}>{u.verificationStatus === 'pending' ? 'Review' : 'View'}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageState>
      </section>
      {openId && <UserReviewModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </DashboardShell>
  )
}
