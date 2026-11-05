import { useState } from 'react'
import { FileCheck2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TextAreaField } from '@/components/ui/field'
import { PageState } from '@/components/shared/state'
import { useFetch } from '@/hooks/use-fetch'
import { api } from '@/lib/api'
import { CATEGORIES, VERIFICATION_LABEL } from '@/lib/constants'
import { formatBytes, formatDate } from '@/lib/format'

export const STATUS_TONE = { pending: 'amber', approved: 'green', rejected: 'red', suspended: 'gray' }

export function UserReviewModal({ id, onClose, onChanged }) {
  const { data, error, loading, reload } = useFetch(`/api/admin/users/${id}`)
  const [note, setNote] = useState('')
  const [cats, setCats] = useState(null)
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const u = data?.user
  const selected = cats ?? u?.categories ?? []

  const act = async (action) => {
    setActionError('')
    setBusy(action)
    try {
      await api(`/api/admin/users/${id}`, { method: 'PATCH', json: { action, note, ...(u.role === 'buyer' && action === 'approve' ? { categories: selected } : {}) } })
      await reload()
      setNote('')
      onChanged?.()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <Badge tone={u ? STATUS_TONE[u.verificationStatus] : 'gray'}>{u ? VERIFICATION_LABEL[u.verificationStatus].toUpperCase() : 'LOADING'}</Badge>
            <h2>{u?.companyName ?? 'Review account'}</h2>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <PageState loading={loading} error={error}>
          {u && (
            <>
              <div className="review-box">
                <div><b>Account type</b><span>{u.role === 'buyer' ? 'Recycler / Buyer' : 'Seller'}</span></div>
                <div><b>Contact</b><span>{u.contactPerson}</span></div>
                <div><b>Email · Phone</b><span>{u.email} · {u.phone || '—'}</span></div>
                <div><b>GSTIN</b><span>{u.gstin || '—'}</span></div>
                <div><b>Business</b><span>{[u.businessType, u.city, u.yearsInOperation].filter(Boolean).join(' · ') || '—'}</span></div>
                <div><b>Registered</b><span>{formatDate(u.createdAt, true)}</span></div>
              </div>
              <h3 className="modal__sub">Verification documents ({u.documents.length})</h3>
              {u.documents.map((d) => (
                <div className="document-row" key={d.id} style={{ marginBottom: 8 }}>
                  <FileCheck2 size={19} />
                  <span><b>{d.filename}</b><small>{d.mime === 'application/pdf' ? 'PDF' : 'Image'} · {formatBytes(d.size)}</small></span>
                  <a className="btn btn--ghost" href={d.url} target="_blank" rel="noreferrer">Open</a>
                </div>
              ))}
              {u.role === 'buyer' && (
                <>
                  <h3 className="modal__sub">Categories to authorise</h3>
                  <p className="modal__hint">Recycler selected these. Untick any the documents don’t support.</p>
                  <div className="chip-picker">
                    {CATEGORIES.map((c) => (
                      <button type="button" key={c} className={selected.includes(c) ? 'selected' : ''} onClick={() => setCats(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c])}>
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {u.verificationNote && <div className="form-alert form-alert--danger" style={{ marginTop: 14 }}>Last note: {u.verificationNote}</div>}
              <div style={{ marginTop: 16 }}>
                <TextAreaField label="Note to user (required to reject or suspend)" value={note} onChange={setNote} placeholder="e.g. Pollution control authorisation has expired." />
              </div>
              {actionError && <div className="form-alert form-alert--danger">{actionError}</div>}
              <div className="modal__actions">
                {['pending', 'rejected'].includes(u.verificationStatus) && (
                  <>
                    {u.verificationStatus === 'pending' && <Button variant="secondary" onClick={() => act('reject')} loading={busy === 'reject'}>Reject</Button>}
                    <Button onClick={() => act('approve')} loading={busy === 'approve'}>Approve & verify</Button>
                  </>
                )}
                {u.verificationStatus === 'approved' && <Button variant="secondary" onClick={() => act('suspend')} loading={busy === 'suspend'}>Suspend account</Button>}
                {u.verificationStatus === 'suspended' && <Button onClick={() => act('reinstate')} loading={busy === 'reinstate'}>Reinstate</Button>}
              </div>
            </>
          )}
        </PageState>
      </div>
    </div>
  )
}
