import { useRef } from 'react'
import { ChevronDown, Home, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { useRouter } from '@/lib/router'
import { useDismiss } from '@/hooks/use-dismiss'
import { ROLE_HOME } from '@/lib/constants'
import { SETTINGS_HREF } from '@/lib/nav'

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '··'

/** Profile chip that opens a menu: Home page, Dashboard, Settings, Logout. */
export function ProfileMenu({ user, open, onToggle, onClose, onLogout }) {
  const router = useRouter()
  const ref = useRef(null)
  useDismiss(ref, open, onClose)

  const go = (to) => {
    onClose()
    router.push(to)
  }

  return (
    <div className="popover-anchor" ref={ref}>
      <button className="profile-chip profile-chip--button" aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <span>{initials(user.companyName)}</span>
        <div>
          <b>{user.companyName}</b>
          <small>{user.role === 'buyer' ? 'Recycler' : user.role}</small>
        </div>
        <ChevronDown size={15} className={open ? 'chevron chevron--open' : 'chevron'} />
      </button>
      {open && (
        <div className="popover popover--menu" role="menu">
          <div className="popover__who">
            <b>{user.companyName}</b>
            <small>{user.email}</small>
          </div>
          <button role="menuitem" onClick={() => go('/')}><Home size={16} /> Home page</button>
          <button role="menuitem" onClick={() => go(ROLE_HOME[user.role])}><LayoutDashboard size={16} /> Dashboard</button>
          <button role="menuitem" onClick={() => go(SETTINGS_HREF[user.role])}><Settings size={16} /> {user.role === 'admin' ? 'Settings' : 'Company settings'}</button>
          <hr />
          <button role="menuitem" className="popover__danger" onClick={onLogout}><LogOut size={16} /> Log out</button>
        </div>
      )}
    </div>
  )
}
