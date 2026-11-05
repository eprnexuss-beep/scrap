import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { api } from '@/lib/api'

export function SettingsView({ role }) {
  const { user, refresh } = useAuth()
  const [p, setP] = useState({ contactPerson: '', phone: '', city: '', businessType: '', yearsInOperation: '' })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pm, setPm] = useState({ kind: '', text: '' })
  const [wm, setWm] = useState({ kind: '', text: '' })
  const [busy, setBusy] = useState('')

  useEffect(() => {
    if (user) setP({ contactPerson: user.contactPerson, phone: user.phone, city: user.city, businessType: user.businessType, yearsInOperation: user.yearsInOperation })
  }, [user])

  const saveProfile = async (e) => {
    e.preventDefault()
    setPm({ kind: '', text: '' })
    setBusy('profile')
    try {
      await api('/api/me', { method: 'PATCH', json: p })
      await refresh()
      setPm({ kind: 'success', text: 'Profile updated.' })
    } catch (err) {
      setPm({ kind: 'danger', text: err.message })
    } finally {
      setBusy('')
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setWm({ kind: '', text: '' })
    if (pw.next !== pw.confirm) return setWm({ kind: 'danger', text: 'New passwords do not match.' })
    setBusy('pw')
    try {
      await api('/api/me/password', { method: 'POST', json: { current: pw.current, next: pw.next } })
      setPw({ current: '', next: '', confirm: '' })
      setWm({ kind: 'success', text: 'Password changed. Other devices have been signed out.' })
    } catch (err) {
      setWm({ kind: 'danger', text: err.message })
    } finally {
      setBusy('')
    }
  }

  const sp = (k) => (v) => setP((x) => ({ ...x, [k]: v }))
  return (
    <DashboardShell role={role} title={role === 'admin' ? 'Settings' : 'Company settings'} subtitle="Manage your profile and sign-in details." active={role === 'admin' ? 'Settings' : 'Company Settings'}>
      <div className="two-column">
        <form className="card" onSubmit={saveProfile}>
          <div className="card-heading"><div><h2>Company profile</h2><p>Verified details can only be changed by EPR Nexuss.</p></div></div>
          {pm.text && <div className={`form-alert form-alert--${pm.kind}`}>{pm.text}</div>}
          <div className="form-grid">
            <Field label="Company name" value={user?.companyName ?? ''} readOnly hint="Locked after verification" />
            <Field label="GSTIN" value={user?.gstin ?? ''} readOnly hint="Locked after verification" />
            <Field label="Email" value={user?.email ?? ''} readOnly hint="Used to sign in" />
            <Field label="Contact person" value={p.contactPerson} onChange={sp('contactPerson')} />
            <Field label="Phone number" value={p.phone} onChange={sp('phone')} inputMode="tel" />
            <Field label="City" value={p.city} onChange={sp('city')} />
            <Field label="Business type" value={p.businessType} onChange={sp('businessType')} />
            <Field label="Years in operation" value={p.yearsInOperation} onChange={sp('yearsInOperation')} />
            {role === 'buyer' && <Field label="Authorised categories" value={(user?.categories ?? []).join(', ')} readOnly className="field--full" hint="Set by EPR Nexuss after reviewing your documents" />}
          </div>
          <Button type="submit" loading={busy === 'profile'}>Save profile</Button>
        </form>
        <form className="card" onSubmit={savePassword}>
          <div className="card-heading"><div><h2>Change password</h2><p>Use at least 8 characters with a letter and a number.</p></div></div>
          {wm.text && <div className={`form-alert form-alert--${wm.kind}`}>{wm.text}</div>}
          <Field label="Current password" type="password" value={pw.current} onChange={(v) => setPw({ ...pw, current: v })} autoComplete="current-password" />
          <Field label="New password" type="password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} autoComplete="new-password" />
          <Field label="Confirm new password" type="password" value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} autoComplete="new-password" />
          <Button type="submit" loading={busy === 'pw'}>Update password</Button>
        </form>
      </div>
    </DashboardShell>
  )
}
