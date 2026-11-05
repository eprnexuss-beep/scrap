import { ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Badge } from '@/components/ui/badge'

export function AuthShell({ children, title, subtitle }) {
  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Logo inverse />
        <div>
          <Badge tone="green">VERIFIED B2B NETWORK</Badge>
          <h1>A cleaner way to trade industrial scrap.</h1>
          <p>
            Secure discovery, private offers and structured settlements—managed in one trusted
            workspace.
          </p>
        </div>
        <div className="auth-quote">
          <ShieldCheck size={22} />
          <p>
            <b>Designed around compliance</b>
            <br />
            Recycler verification and controlled access protect every participant.
          </p>
        </div>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <Logo />
          <div className="auth-heading">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
