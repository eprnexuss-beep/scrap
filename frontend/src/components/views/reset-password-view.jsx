import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAppNav } from '@/hooks/use-app-nav'
import { AuthShell } from '@/components/layout/auth-shell'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { api } from '@/lib/api'

export function ResetPasswordView() {
  const go = useAppNav()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) return setError('This reset link is incomplete. Request a new one from the login page.')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      await api('/api/auth/reset', { method: 'POST', json: { token, password } })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can now sign in with your new password.">
        <div className="success-state">
          <span>
            <CheckCircle2 size={34} />
          </span>
          <Button className="btn--full" onClick={() => go('login')}>
            Continue to login
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password for your EPR Nexuss account.">
      <form onSubmit={submit}>
        {error && <div className="form-alert form-alert--danger" role="alert">{error}</div>}
        <Field
          label="New password"
          type="password"
          placeholder="At least 8 characters, with a letter and a number"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />
        <Field
          label="Confirm new password"
          type="password"
          placeholder="Re-enter the password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          required
        />
        <Button type="submit" className="btn--full" loading={busy}>
          Update password
        </Button>
      </form>
    </AuthShell>
  )
}
