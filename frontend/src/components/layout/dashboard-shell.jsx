import { useState } from 'react'
import { Home, LogOut, Menu, PanelLeftClose } from 'lucide-react'
import { useRouter } from '@/lib/router'
import { Logo } from '@/components/ui/logo'
import { useAuth } from '@/components/providers/auth-provider'
import { VerificationBanner } from '@/components/shared/verification-banner'
import { NotificationBell } from '@/components/layout/notification-bell'
import { ProfileMenu } from '@/components/layout/profile-menu'
import { SIDEBAR } from '@/lib/nav'

export function DashboardShell({ role, children, title, subtitle, active = 'Dashboard' }) {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [menu, setMenu] = useState(false) // mobile sidebar
  const [panel, setPanel] = useState(null) // 'notifications' | 'profile' | null

  const navigate = (href) => {
    setMenu(false)
    if (href) router.push(href)
  }

  const signOut = async () => {
    setPanel(null)
    await logout()
    router.replace('/login')
  }

  const toggle = (name) => setPanel((p) => (p === name ? null : name))

  if (loading || !user) return <div className="auth-screen-loading">Loading your workspace…</div>

  return (
    <div className="dashboard-shell">
      <aside className={menu ? 'sidebar sidebar--open' : 'sidebar'}>
        <div className="sidebar__top">
          <button className="sidebar__brand" onClick={() => navigate('/')} aria-label="EPR Nexuss home page">
            <Logo inverse />
          </button>
          <button onClick={() => setMenu(false)} aria-label="Close menu">
            <PanelLeftClose size={19} />
          </button>
        </div>
        <nav>
          {SIDEBAR[role].map(([label, Icon, href]) => (
            <button className={active === label ? 'active' : ''} onClick={() => navigate(href)} key={label}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar__foot">
          <button className="sidebar__logout" onClick={() => navigate('/')}>
            <Home size={18} /> Home page
          </button>
          <button className="sidebar__logout" onClick={signOut}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <button className="dashboard-menu" onClick={() => setMenu(true)} aria-label="Open menu">
            <Menu size={21} />
          </button>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="dashboard-header__actions">
            <a className="main-website-link" href="https://www.eprnexuss.com" target="_blank" rel="noopener noreferrer">
              Main Website <span aria-hidden="true">↗</span>
            </a>
            <NotificationBell open={panel === 'notifications'} onToggle={() => toggle('notifications')} onClose={() => setPanel(null)} />
            <ProfileMenu user={user} open={panel === 'profile'} onToggle={() => toggle('profile')} onClose={() => setPanel(null)} onLogout={signOut} />
          </div>
        </header>
        <main className="dashboard-content">
          <VerificationBanner user={user} />
          {children}
        </main>
      </div>
    </div>
  )
}
