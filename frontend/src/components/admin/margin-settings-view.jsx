import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { MarginCard } from '@/components/admin/margin-card'
import { PageState } from '@/components/shared/state'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { useFetch } from '@/hooks/use-fetch'
import { api } from '@/lib/api'

const SAMPLE_BASE = 45000

// Shared by the Margin Settings page and the dashboard card: edits the platform-wide DEFAULT margin.
export function DefaultMarginEditor({ compact = false }) {
  const { data, error, loading } = useFetch('/api/admin/settings/pricing')
  const [type, setType] = useState('fixed')
  const [value, setValue] = useState('')
  const [days, setDays] = useState('7')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ kind: '', text: '' })

  useEffect(() => {
    if (!data) return
    setType(data.pricing.defaultMarginType)
    setValue(String(data.pricing.defaultMarginValue))
    setDays(String(data.pricing.offerWindowDays))
  }, [data])

  const save = async () => {
    setMsg({ kind: '', text: '' })
    setBusy(true)
    try {
      await api('/api/admin/settings/pricing', { method: 'PUT', json: { defaultMarginType: type, defaultMarginValue: Number(value), offerWindowDays: Number(days) || 7 } })
      setMsg({ kind: 'success', text: 'Default pricing saved. It pre-fills every new listing review.' })
    } catch (err) {
      setMsg({ kind: 'danger', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageState loading={loading} error={error}>
      <MarginCard base={SAMPLE_BASE} type={type} value={value} onType={setType} onValue={setValue} title="Default margin" subtitle="Used to pre-fill new listings · figures below are an example" baseLabel="Example seller price">
        {!compact && <Field label="Default offer window (days)" type="number" min="1" max="60" value={days} onChange={setDays} />}
        {msg.text && <div className={`form-alert form-alert--${msg.kind}`}>{msg.text}</div>}
        <Button className="btn--full" onClick={save} loading={busy}>Save & apply pricing</Button>
      </MarginCard>
    </PageState>
  )
}

export function MarginSettingsView() {
  return (
    <DashboardShell role="admin" title="Margin settings" subtitle="Platform-wide default pricing. Each listing can still be priced individually during review." active="Margin Settings">
      <div style={{ maxWidth: 640 }}>
        <DefaultMarginEditor />
      </div>
    </DashboardShell>
  )
}
