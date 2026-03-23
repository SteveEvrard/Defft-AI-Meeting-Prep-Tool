import { ReportView } from './ReportView'
import type { GeneratedPrepReport } from '../../types/domain'

interface ReportPageProps {
  report: GeneratedPrepReport | null
  isGenerating: boolean
  onBack: () => void
}

export function ReportPage({ report, isGenerating, onBack }: ReportPageProps) {
  return (
    <div className="report-page">
      <header className="report-page__header">
        <div>
          <p className="section-kicker">Meeting research report</p>
          <h1>{report?.snapshot.companyName ?? 'Generating research report'}</h1>
          {report ? (
            <p className="report-page__meta">
              {report.snapshot.meetingTitle} • {report.snapshot.meetingTime}
            </p>
          ) : null}
        </div>

        <div className="report-page__actions">
          <button className="ghost-button" onClick={onBack} type="button">
            Back to meetings
          </button>
          <button className="primary-button" type="button">
            Export brief
          </button>
        </div>
      </header>

      {isGenerating || !report ? (
        <div className="report-page__loading">
          <div className="skeleton skeleton--hero" />
          <div className="generating-grid">
            <div className="skeleton skeleton--card" />
            <div className="skeleton skeleton--card" />
            <div className="skeleton skeleton--card" />
            <div className="skeleton skeleton--card" />
          </div>
        </div>
      ) : (
        <ReportView report={report} />
      )}
    </div>
  )
}
