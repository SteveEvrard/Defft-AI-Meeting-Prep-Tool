import type { GeneratedPrepReport } from '../../types/domain'

interface PriorityBriefProps {
  report: GeneratedPrepReport
}

export function PriorityBrief({ report }: PriorityBriefProps) {
  const maxSpend = Math.max(...report.priorityBrief.spendActivity.map((point) => point.amount), 1)

  return (
    <section className="priority-brief">
      <div className="priority-brief__header">
        <h2>{report.snapshot.companyName}</h2>
        <article className="priority-brief__goal">
          <span>Meeting goal</span>
          <ul>
            {report.priorityBrief.meetingGoals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
          <div className="priority-brief__spend">
            <div className="priority-brief__spend-header">
              <strong>Recent customer spend activity</strong>
            </div>
            <div className="priority-brief__chart" aria-label="Recent customer spend activity chart">
              {report.priorityBrief.spendActivity.map((point) => (
                <div className="priority-brief__bar-group" key={point.label}>
                  <span className="priority-brief__bar-value">
                    {point.amount > 0
                      ? `$${Math.round(point.amount / 1000)}k`
                      : report.snapshot.customerStatus === 'Prospect'
                        ? 'No spend'
                        : '$0'}
                  </span>
                  <div className="priority-brief__bar-track">
                    <div
                      className="priority-brief__bar-fill"
                      style={{ height: `${Math.max((point.amount / maxSpend) * 100, point.amount > 0 ? 14 : 6)}%` }}
                    />
                  </div>
                  <span className="priority-brief__bar-label">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="priority-brief__grid">
        {report.priorityBrief.items.map((item) => (
          <article className="priority-brief__card" key={`${item.label}-${item.title}`}>
            <span>{item.label}</span>
            <h3>{item.title}</h3>
            <ul>
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            {item.sourceSummary ? <p className="priority-brief__source">Source: {item.sourceSummary}</p> : null}
          </article>
        ))}
      </div>
    </section>
  )
}
