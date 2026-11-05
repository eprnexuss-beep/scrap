import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'

export function PublicHeader({ go }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <header className="public-header">
      <button className="logo-button" onClick={() => go('home')}>
        <Logo />
      </button>
      <nav className={open ? 'public-nav public-nav--open' : 'public-nav'}>
        <Link to="/" onClick={() => setOpen(false)}>Home</Link>
        <Link to="/#how" onClick={() => setOpen(false)}>How it works</Link>
        <Link to="/#categories" onClick={() => setOpen(false)}>Categories</Link>
        <Link to="/#trust" onClick={() => setOpen(false)}>Trust & safety</Link>
        <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
        <a href="https://www.eprnexuss.com" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Main Website ↗</a>
      </nav>
      <div className="header-actions">
        {user ? (
          <>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
            <Button onClick={() => go(user.role === 'buyer' ? 'buyer' : user.role === 'seller' ? 'seller' : 'admin')}>
              My dashboard <ArrowRight size={16} />
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => go('login')}>
              Login
            </Button>
            <Button onClick={() => go('register')}>
              Register <ArrowRight size={16} />
            </Button>
          </>
        )}
      </div>
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        <Menu size={22} />
      </button>
    </header>
  )
}
