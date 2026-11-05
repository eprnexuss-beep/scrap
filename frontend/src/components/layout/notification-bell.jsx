import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useRouter } from '@/lib/router'
import { useDismiss } from '@/hooks/use-dismiss'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/format'

/** Bell icon with an unread badge; clicking it opens a popover with recent notifications. */
export function NotificationBell({ open, onToggle, onClose }) {
  const router = useRouter()
  const ref = useRef(null)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api('/api/notifications')
      setItems(data.items.slice(0, 30))
      setUnread(data.unread)
    } catch {}
  }, [])

  // Keep the badge fresh; refetch the list each time the popover opens.
  useEffect(() => {
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [load])
  useEffect(() => {
    if (open) {
      setLoading(true)
      load().finally(() => setLoading(false))
    }
  }, [open, load])

  useDismiss(ref, open, onClose)

  const openItem = async (n) => {
    if (!n.read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnread((u) => Math.max(0, u - 1))
      api('/api/notifications', { method: 'POST', json: { ids: [n.id] } }).catch(() => {})
    }
    onClose()
    if (n.link) router.push(n.link)
  }

  const markAll = async () => {
    setItems((list) => list.map((x) => ({ ...x, read: true })))
    setUnread(0)
    await api('/api/notifications', { method: 'POST', json: { all: true } }).catch(() => {})
  }

  return (
    <div className="popover-anchor" ref={ref}>
      <button className="icon-button" aria-label="Notifications" aria-expanded={open} onClick={onToggle}>
        <Bell size={19} />
        {unread > 0 && <i />}
      </button>
      {open && (
        <div className="popover popover--notifications" role="dialog" aria-label="Notifications">
          <div className="popover__head">
            <b>Notifications</b>
            {unread > 0 && (
              <button className="popover__link" onClick={markAll}>
                <CheckCheck size={14} /> Mark all as read
              </button>
            )}
          </div>
          <div className="popover__body">
            {loading && items.length === 0 && <p className="popover__empty">Loading…</p>}
            {!loading && items.length === 0 && <p className="popover__empty">You’re all caught up.</p>}
            {items.map((n) => (
              <button key={n.id} className={`notif-item ${n.read ? '' : 'notif-item--unread'}`} onClick={() => openItem(n)}>
                <span className="notif-item__icon"><Bell size={15} /></span>
                <span className="notif-item__text">
                  <b>{n.title}</b>
                  {n.body && <small>{n.body}</small>}
                  <em>{timeAgo(n.createdAt)}</em>
                </span>
                {!n.read && <i className="unread-dot" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
