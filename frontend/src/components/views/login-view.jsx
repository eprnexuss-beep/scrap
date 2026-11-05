import { useState } from 'react'
import { useRouter } from '@/lib/router'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAppNav } from '@/hooks/use-app-nav'
import { useAuth } from '@/components/providers/auth-provider'
import { AuthShell } from '@/components/layout/auth-shell'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { api } from '@/lib/api'
import { ROLE_HOME } from '@/lib/constants'

const roles = ['buyer', 'seller', 'admin']

export function LoginView() {
  const go = useAppNav()
  const router = useRouter()
  const { login } = useAuth()
  const [role, setRole] = useState('buyer')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const user = await login({ identifier, password, role, remember })
      const next = new URLSearchParams(window.location.search).get('next')
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null
      router.replace(safeNext ?? ROLE_HOME[user.role])
      router.refresh()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const forgot = async () => {
    setError('')
    setInfo('')
    if (identifier.trim().length < 3) {
      setError('Enter your email or phone number above first, then choose "Forgot password?".')
      return
    }
    try {
      const data = await api('/api/auth/forgot', { method: 'POST', json: { identifier } })
      setInfo(data.message)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your EPR Nexuss workspace.">
      <form onSubmit={submit}>
        <div className="segmented">
          {roles.map((item) => (
            <button
              type="button"
              className={role === item ? 'active' : ''}
              onClick={() => setRole(item)}
              key={item}
            >
              {item === 'buyer' ? 'Recycler' : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        {error && <div className="form-alert form-alert--danger" role="alert">{error}</div>}
        {info && <div className="form-alert form-alert--success" role="status">{info}</div>}
        <Field
          label="Email or phone number"
          placeholder="name@company.com"
          value={identifier}
          onChange={setIdentifier}
          name="identifier"
          autoComplete="username"
          required
        />
        <label className="field">
          <span>Password</span>
          <div className="field__control">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              name="password"
              autoComplete="current-password"
              required
            />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <div className="form-row">
          <label className="check-control">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
          </label>
          <button type="button" className="text-link" onClick={forgot}>
            Forgot password?
          </button>
        </div>
        <Button type="submit" className="btn--full" loading={busy}>
          Login securely <ArrowRight size={16} />
        </Button>
        <p className="auth-foot">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={() => go('register')}>
            Register here
          </button>
        </p>
      </form>
    </AuthShell>
  )
}
