import { useState } from 'react'
import { FileCheck2 } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { FilePicker } from '@/components/shared/file-picker'
import { PageState, EmptyState } from '@/components/shared/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { api } from '@/lib/api'
import { VERIFICATION_LABEL } from '@/lib/constants'
import { formatBytes, formatDate } from '@/lib/format'

export function DocumentsView({ role }) {
  const { data, error, loading, reload } = useFetch('/api/me/documents')
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ kind: '', text: '' })

  const upload = async () => {
    setMsg({ kind: '', text: '' })
    setBusy(true)
    try {
      const form = new FormData()
      files.forEach((f) => form.append('documents', f))
      await api('/api/me/documents', { method: 'POST', form })
      setFiles([])
      setMsg({ kind: 'success', text: 'Documents uploaded. EPR Nexuss has been notified.' })
      reload()
    } catch (e) {
      setMsg({ kind: 'danger', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardShell role={role} title="Documents" subtitle="Your verification and compliance documents." active="Documents">
      <section className="card">
        <div className="card-heading">
          <div><h2>Documents on file</h2><p>Only you and EPR Nexuss administrators can open these.</p></div>
          {data && <Badge tone={data.verificationStatus === 'approved' ? 'green' : 'amber'}>{VERIFICATION_LABEL[data.verificationStatus]}</Badge>}
        </div>
        <PageState loading={loading && !data} error={error}>
          {data?.documents.length === 0 && <EmptyState title="No documents yet" text="Upload your registration and authorisation documents below." />}
          {data?.documents.map((d) => (
            <div className="document-row" key={d.id} style={{ marginBottom: 8 }}>
              <FileCheck2 size={19} />
              <span><b>{d.filename}</b><small>{d.mime === 'application/pdf' ? 'PDF' : 'Image'} · {formatBytes(d.size)} · Uploaded {formatDate(d.createdAt)}</small></span>
              <a className="btn btn--ghost" href={d.url} target="_blank" rel="noreferrer">Open</a>
            </div>
          ))}
        </PageState>
      </section>
      <section className="card">
        <div className="card-heading"><div><h2>Add documents</h2><p>Renewed licences or additional proof. PDF, JPG or PNG, up to 10 MB each.</p></div></div>
        {msg.text && <div className={`form-alert form-alert--${msg.kind}`}>{msg.text}</div>}
        <FilePicker files={files} onChange={setFiles} mode="docs" max={5} buttonLabel="Select files" />
        {files.length > 0 && <div style={{ textAlign: 'center', marginTop: 14 }}><Button onClick={upload} loading={busy}>Upload {files.length} file{files.length === 1 ? '' : 's'}</Button></div>}
      </section>
    </DashboardShell>
  )
}
