import { SectionCard } from '../../components/SectionCard'
import type { Account, GeneratedPrepReport, Meeting } from '../../types/domain'

interface RightRailProps {
  meeting: Meeting | null
  account: Account | null
  report: GeneratedPrepReport | null
  isGenerating: boolean
  onGenerateReport: () => void
}

const formatGeneratedAt = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))

export function RightRail({
  meeting,
  account,
  report,
  isGenerating,
  onGenerateReport,
}: RightRailProps) {
  if (!meeting || !account) {
    return (
      <aside className="right-rail">
        <SectionCard title="Quick Actions" eyebrow="No meeting selected">
          <p className="muted-copy">
            Select a meeting from the left to generate a tailored prep brief with source-backed recommendations.
          </p>
        </SectionCard>
      </aside>
    )
  }

  return (
    <aside className="right-rail">
      <SectionCard title="In-Depth Research Report">
        <p className="muted-copy">
          Launch a short guided intake to capture deal stage and key meeting context before the
          full report is generated.
        </p>
        <div className="quick-actions">
          <button className="primary-button" onClick={onGenerateReport} type="button">
            {isGenerating ? 'Opening intake...' : 'Generate research report'}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Meeting Context" eyebrow="Selected meeting">
        <div className="rail-metrics">
          <div>
            <span>Meeting type</span>
            <strong>{report?.snapshot.meetingType ?? meeting.type.replace('_', ' ')}</strong>
          </div>
          <div>
            <span>Customer status</span>
            <strong>{account.status === 'existing' ? 'Existing customer' : 'Prospect'}</strong>
          </div>
        </div>
        {report ? <p className="muted-copy">Last generated {formatGeneratedAt(report.generatedAt)}</p> : null}
      </SectionCard>

      <SectionCard title="Suggested Uses" eyebrow="When to generate">
        <p className="muted-copy">
          Best for account reviews, prospect calls, pricing discussions, and any meeting where the rep needs full context before the conversation.
        </p>
      </SectionCard>
    </aside>
  )
}
