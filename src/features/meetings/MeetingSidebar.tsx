import { Badge } from '../../components/Badge'
import type { Account, Contact, Meeting } from '../../types/domain'

interface MeetingSidebarProps {
  meetings: Meeting[]
  isLoading?: boolean
  errorMessage?: string | null
  hasMoreMeetings?: boolean
  selectedMeetingId: string | null
  accounts: Account[]
  contacts: Contact[]
  onLoadMore: () => void
  onSelectMeeting: (meetingId: string) => void
}

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

const byDay = (meetings: Meeting[]) =>
  meetings.reduce<Record<string, Meeting[]>>((grouped, meeting) => {
    const key = dayFormatter.format(new Date(meeting.startAt))
    grouped[key] = [...(grouped[key] ?? []), meeting]
    return grouped
  }, {})

export function MeetingSidebar({
  meetings,
  isLoading = false,
  errorMessage = null,
  hasMoreMeetings = false,
  selectedMeetingId,
  accounts,
  contacts,
  onLoadMore,
  onSelectMeeting,
}: MeetingSidebarProps) {
  const groupedMeetings = Object.entries(byDay(meetings))

  return (
    <aside className="meeting-sidebar">
      <div className="meeting-sidebar__header">
        <div>
          <p className="section-kicker">Calendar sync</p>
          <h2>Upcoming meetings</h2>
        </div>
        <Badge tone="teal">{meetings.length} scheduled</Badge>
      </div>

      <div className="meeting-chip-row" aria-label="Upcoming meetings">
        {meetings.map((meeting) => {
          const account = accounts.find((item) => item.id === meeting.accountId)

          return (
            <button
              key={`chip-${meeting.id}`}
              type="button"
              className={selectedMeetingId === meeting.id ? 'meeting-chip is-selected' : 'meeting-chip'}
              onClick={() => onSelectMeeting(meeting.id)}
            >
              <strong>{account?.name ?? meeting.title}</strong>
              <span>{timeFormatter.format(new Date(meeting.startAt))}</span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <p className="muted-copy">Syncing upcoming meetings from Google Calendar...</p>
      ) : errorMessage ? (
        <p className="muted-copy">{errorMessage}</p>
      ) : meetings.length === 0 ? (
        <p className="muted-copy">No upcoming external meetings were found on your Google Calendar.</p>
      ) : null}

      <div className="meeting-groups">
        {groupedMeetings.map(([day, dayMeetings]) => (
          <section key={day} className="meeting-group">
            <p className="meeting-group__day">{day}</p>
            {dayMeetings.map((meeting) => {
              const account = accounts.find((item) => item.id === meeting.accountId)
              const primaryContact = contacts.find((contact) => meeting.contactIds.includes(contact.id))

              return (
                <button
                  key={meeting.id}
                  type="button"
                  className={selectedMeetingId === meeting.id ? 'meeting-card is-selected' : 'meeting-card'}
                  onClick={() => onSelectMeeting(meeting.id)}
                >
                  <div className="meeting-card__time">
                    <strong>{timeFormatter.format(new Date(meeting.startAt))}</strong>
                    <span>{meeting.durationMinutes} min</span>
                  </div>
                  <div className="meeting-card__content">
                    <div className="meeting-card__topline">
                      <h3>{meeting.title}</h3>
                      <Badge tone={account?.status === 'existing' ? 'warm' : 'cyan'}>
                        {account?.status === 'existing' ? 'Existing' : 'Prospect'}
                      </Badge>
                    </div>
                    <p>{account?.name}</p>
                    <span>
                      {primaryContact?.name}
                      {primaryContact ? ` • ${primaryContact.role}` : ''}
                    </span>
                  </div>
                </button>
              )
            })}
          </section>
        ))}
      </div>

      {hasMoreMeetings ? (
        <div className="meeting-sidebar__footer">
          <button className="secondary-button meeting-sidebar__load-more" onClick={onLoadMore} type="button">
            Load next week
          </button>
        </div>
      ) : null}
    </aside>
  )
}
