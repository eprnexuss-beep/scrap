import { Clock3, ShieldAlert } from 'lucide-react'

// Shown on every seller/recycler screen until an admin approves the account.
export function VerificationBanner({ user }) {
  if (!user || user.role === 'admin' || user.verificationStatus === 'approved') return null
  const status = user.verificationStatus

  const copy = {
    pending: {
      title: 'Your account is under review',
      text: 'EPR Nexuss is checking your documents (usually 2–3 business days). You can look around now; listing, offers and deals unlock once you are verified.',
    },
    rejected: {
      title: 'Verification was not approved',
      text: user.verificationNote
        ? `Reason: ${user.verificationNote}`
        : 'Please contact EPR Nexuss support to update your documents.',
    },
    suspended: { title: 'Account suspended', text: 'Please contact EPR Nexuss support.' },
  }[status]

  return (
    <div className={`verify-banner verify-banner--${status}`}>
      {status === 'pending' ? <Clock3 size={19} /> : <ShieldAlert size={19} />}
      <div>
        <b>{copy.title}</b>
        {copy.text}
      </div>
    </div>
  )
}
