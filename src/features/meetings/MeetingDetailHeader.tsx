import { Badge } from '../../components/Badge'
import type { Account, Contact, Meeting } from '../../types/domain'

interface MeetingDetailHeaderProps {
  meeting: Meeting
  account: Account
  contacts: Contact[]
  onRegenerate: () => void
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function MeetingDetailHeader({
  meeting,
  account,
  contacts,
  onRegenerate,
}: MeetingDetailHeaderProps) {
  return (
    <section className="detail-header">
      <div className="detail-header__content">
        <div className="detail-header__badges">
          <Badge tone={account.status === 'existing' ? 'warm' : 'cyan'}>
            {account.status === 'existing' ? 'Existing Customer' : 'Prospect'}
          </Badge>
          <Badge tone="neutral">{meeting.integrationSource}</Badge>
        </div>
        <h2>{meeting.title}</h2>
        <p>{meeting.purpose}</p>
        <div className="detail-header__meta">
          <span>{dateTimeFormatter.format(new Date(meeting.startAt))}</span>
          <span>{meeting.location}</span>
          <span>{contacts.map((contact) => contact.name).join(', ')}</span>
        </div>
      </div>

      <div className="detail-header__actions">
        <button className="ghost-button" type="button">
          Export brief
        </button>
        <button className="primary-button" onClick={onRegenerate} type="button">
          Regenerate recommendations
        </button>
      </div>
    </section>
  )
}
