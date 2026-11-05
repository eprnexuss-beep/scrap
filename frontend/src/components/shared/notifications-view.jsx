import { useRouter } from '@/lib/router'
import { Bell, CheckCheck } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageState, EmptyState } from '@/components/shared/state'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/format'

export function NotificationsView({ role }) {
  const router = useRouter()
  const { data, error, loading, reload } = useFetch('/api/notifications')

  const open = async (n) => {
    if (!n.read) await api('/api/notifications', { method: 'POST', json: { ids: [n.id] } }).catch(() => {})
    if (n.link) router.push(n.link)
    else reload()
  }
  const markAll = async () => {
    await api('/api/notifications', { method: 'POST', json: { all: true } })
    reload()
  }

  return (
    <DashboardShell role={role} title="Notifications" subtitle="Updates on your account, listings and deals." active="Notifications">
      <section className="card">
        <div className="card-heading">
          <div><h2>Recent activity</h2><p>{data ? `${data.unread} unread` : ' '}</p></div>
          {data?.unread > 0 && <Button variant="secondary" onClick={markAll}><CheckCheck size={16} /> Mark all as read</Button>}
        </div>
        <PageState loading={loading && !data} error={error}>
          {data?.items.length === 0 ? (
            <EmptyState title="You’re all caught up" text="New notifications will appear here." />
          ) : (
            data?.items.map((n) => (
              <button key={n.id} className="activity-row notif-row" onClick={() => open(n)} style={{ width: '100%', background: 'none', border: 0, borderTop: '1px solid var(--line)', textAlign: 'left', cursor: 'pointer' }}>
                <span className="activity-icon"><Bell size={17} /></span>
                <div>
                  <b style={{ fontWeight: n.read ? 600 : 800 }}>{n.title}</b>
                  {n.body && <small style={{ fontSize: 10 }}>{n.body}</small>}
                  <small>{timeAgo(n.createdAt)}</small>
                </div>
                {!n.read && <i className="unread-dot" />}
              </button>
            ))
          )}
        </PageState>
      </section>
    </DashboardShell>
  )
}
