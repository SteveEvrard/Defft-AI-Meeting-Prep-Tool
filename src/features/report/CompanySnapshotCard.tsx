import { useEffect, useState } from 'react'
import { SectionCard } from '../../components/SectionCard'
import { loadCompanySnapshot, type CompanySnapshot } from '../../lib/company-snapshot'
import type { Account, Contact, Meeting } from '../../types/domain'

interface CompanySnapshotCardProps {
  meeting: Meeting
  account: Account
  contacts: Contact[]
}

export function CompanySnapshotCard({ meeting, account, contacts }: CompanySnapshotCardProps) {
  const [snapshot, setSnapshot] = useState<CompanySnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadSnapshot = async () => {
      setIsLoading(true)
      const nextSnapshot = await loadCompanySnapshot(meeting, account, contacts)

      if (!cancelled) {
        setSnapshot(nextSnapshot)
        setIsLoading(false)
      }
    }

    void loadSnapshot()

    return () => {
      cancelled = true
    }
  }, [account, contacts, meeting])

  return (
    <SectionCard
      title={snapshot?.companyName ?? account.name}
      eyebrow="Company snapshot"
      aside={
        snapshot?.websiteUrl ? (
          <a className="company-snapshot__link" href={snapshot.websiteUrl} rel="noreferrer" target="_blank">
            Visit site
          </a>
        ) : null
      }
    >
      <div className="company-snapshot">
        <div className="company-snapshot__header">
          {snapshot?.logoUrl ? (
            <img
              className="company-snapshot__logo"
              src={snapshot.logoUrl}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : null}
          <div>
            <p className="company-snapshot__headline">
              {isLoading ? 'Building a quick company snapshot...' : snapshot?.headline}
            </p>
            <div className="company-snapshot__chips">
              {snapshot?.domain ? <span className="company-snapshot__chip">{snapshot.domain}</span> : null}
              {snapshot?.sourceLabel ? (
                <span className="company-snapshot__chip company-snapshot__chip--muted">
                  {snapshot.sourceLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <article className="mini-card company-snapshot__goal-card">
          <span>Meeting goal</span>
          <p>{snapshot?.meetingGoal ?? meeting.purpose}</p>
        </article>

        <div className="company-snapshot__talking-points">
          <span>At a glance</span>
          <ul>
            {(snapshot?.talkingPoints ?? []).slice(0, 2).map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  )
}
