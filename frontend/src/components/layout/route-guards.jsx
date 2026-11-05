import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/components/providers/auth-provider'
import { ROLE_HOME } from '@/lib/constants'

const Loading = () => <div className="auth-screen-loading">Loading…</div>

/** Only a signed-in user with this role may see the page; everyone else is redirected. */
export function RequireRole({ role, children }) {
  const { user, loading, justLoggedOut } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) {
    const to = justLoggedOut ? '/login' : `/login?next=${encodeURIComponent(location.pathname)}`
    return <Navigate to={to} replace />
  }
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />
  return children
}

/** Login / register are for signed-out visitors; signed-in users go to their dashboard. */
export function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (user) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />
  return children
}
