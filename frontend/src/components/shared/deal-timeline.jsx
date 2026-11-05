import { Check } from 'lucide-react'
import { DEAL_STAGES } from '@/lib/constants'
import { formatDate } from '@/lib/format'

/** 7-stage fulfilment timeline. A stage counts as done once it — or any later stage — has been reached. */
export function DealTimeline({ timeline = [], closed = false }) {
  const reached = Object.fromEntries(timeline.map((t) => [t.key, t.at]))
  const lastDone = Math.max(-1, ...DEAL_STAGES.map((s, i) => (reached[s.key] ? i : -1)))
  return (
    <div className="timeline">
      {DEAL_STAGES.map((stage, i) => {
        const done = i <= lastDone
        const current = !done && !closed && i === lastDone + 1
        return (
          <div className={done ? 'done' : current ? 'current' : ''} key={stage.key}>
            <span>{done ? <Check size={14} /> : i + 1}</span>
            <div>
              <b>{stage.label}</b>
              <small>{reached[stage.key] ? formatDate(reached[stage.key], true) : current ? 'In progress' : 'Pending'}</small>
            </div>
          </div>
        )
      })}
    </div>
  )
}
