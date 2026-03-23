import { Badge } from '../../components/Badge'
import { SectionCard } from '../../components/SectionCard'
import { SourcePills } from '../../components/SourcePills'
import type { GeneratedPrepReport, ReportInsight } from '../../types/domain'

interface ReportViewProps {
  report: GeneratedPrepReport
}

function InsightList({ items }: { items: ReportInsight[] }) {
  return (
    <div className="insight-list">
      {items.map((item) => (
        <article className="insight-card" key={`${item.title}-${item.detail}`}>
          <div className="insight-card__header">
            <h4>{item.title}</h4>
            <div className="insight-card__badges">
              {item.priority ? <Badge tone="warm">{item.priority} priority</Badge> : null}
              {item.confidence ? <Badge tone="teal">{item.confidence} confidence</Badge> : null}
            </div>
          </div>
          <p>{item.detail}</p>
          <SourcePills sources={item.sources} />
        </article>
      ))}
    </div>
  )
}

function formatKpiValue(value: number, format: 'currency' | 'count' | 'days') {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (format === 'days') {
    return `${value} days`
  }

  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

export function ReportView({ report }: ReportViewProps) {
  return (
    <div className="report-view">
      <SectionCard title="Stage-Specific Focus" eyebrow="AI emphasis for this meeting">
        <div className="two-column">
          <article className="mini-card">
            <span>Deal stage</span>
            <p>{report.stageFocus.stageLabel}</p>
          </article>
          <article className="mini-card">
            <span>Primary emphasis</span>
            <p>{report.stageFocus.emphasisLabel}</p>
          </article>
        </div>
        <article className="mini-card">
          <span>Why this matters now</span>
          <p>{report.stageFocus.emphasisSummary}</p>
        </article>
      </SectionCard>

      <SectionCard title="Meeting Objective" eyebrow="Rep-defined and AI-shaped">
        <div className="two-column">
          <article className="mini-card">
            <span>Meeting type</span>
            <p>{report.meetingObjective.meetingType}</p>
          </article>
          <article className="mini-card">
            <span>Expected outcome</span>
            <p>{report.meetingObjective.expectedOutcome}</p>
          </article>
        </div>
        <div className="two-column">
          <article className="mini-card">
            <span>Primary objective</span>
            <p>{report.meetingObjective.primaryObjective}</p>
          </article>
          <article className="mini-card">
            <span>Secondary objective</span>
            <p>{report.meetingObjective.secondaryObjective}</p>
          </article>
        </div>
        <article className="mini-card">
          <span>Suggested agenda</span>
          <ul>
            {report.meetingObjective.agenda.map((item) => (
              <li key={`${item.topic}-${item.duration}`}>
                {item.topic} ({item.duration})
              </li>
            ))}
          </ul>
        </article>
      </SectionCard>

      <SectionCard
        title="Meeting Snapshot"
        eyebrow="AI-generated prep brief"
        aside={<Badge tone="success">{report.snapshot.customerStatus}</Badge>}
      >
        <div className="snapshot-grid">
          <div>
            <span>Meeting title</span>
            <strong>{report.snapshot.meetingTitle}</strong>
          </div>
          <div>
            <span>Company</span>
            <strong>{report.snapshot.companyName}</strong>
          </div>
          <div>
            <span>Contacts</span>
            <strong>{report.snapshot.contactSummary}</strong>
          </div>
          <div>
            <span>Meeting time</span>
            <strong>{report.snapshot.meetingTime}</strong>
          </div>
          <div>
            <span>Purpose</span>
            <strong>{report.snapshot.purpose}</strong>
          </div>
          <div>
            <span>Meeting type</span>
            <strong>{report.snapshot.meetingType}</strong>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Opportunity Score" eyebrow="Attractiveness and fit">
        <div className="two-column">
          <article className="mini-card">
            <span>Overall score</span>
            <p>{report.opportunityScore.score} / 100</p>
          </article>
          <article className="mini-card">
            <span>Territory comparison</span>
            <p>{report.opportunityScore.territoryComparison}</p>
          </article>
        </div>
        <div className="two-column">
          <article className="mini-card">
            <span>Key drivers</span>
            <ul>
              {report.opportunityScore.keyDrivers.map((driver) => (
                <li key={driver}>{driver}</li>
              ))}
            </ul>
          </article>
          <article className="mini-card">
            <span>Risk factors</span>
            <ul>
              {report.opportunityScore.riskFactors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Deal Probability" eyebrow="Likelihood and timeline">
        <div className="two-column">
          <article className="mini-card">
            <span>Estimated likelihood</span>
            <p>{report.dealProbability.winLikelihood}%</p>
          </article>
          <article className="mini-card">
            <span>Projected timeline</span>
            <p>{report.dealProbability.timeline}</p>
          </article>
        </div>
        <div className="two-column">
          <article className="mini-card">
            <span>Positive drivers</span>
            <ul>
              {report.dealProbability.positiveDrivers.map((driver) => (
                <li key={driver}>{driver}</li>
              ))}
            </ul>
          </article>
          <article className="mini-card">
            <span>Negative factors</span>
            <ul>
              {report.dealProbability.negativeDrivers.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </article>
        </div>
        <article className="mini-card">
          <span>Confidence level</span>
          <p>{report.dealProbability.confidence}</p>
        </article>
      </SectionCard>

      <SectionCard title="Sales KPI Snapshot" eyebrow="Fast commercial read">
        <div className="kpi-metrics">
          {report.kpis.metrics.map((metric) => (
            <article className="kpi-metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.context}</p>
            </article>
          ))}
        </div>

        <div className="kpi-charts">
          {report.kpis.charts.map((chart) => {
            const maxValue = Math.max(...chart.points.map((point) => point.value), 1)

            return (
              <article className="kpi-chart-card" key={chart.title}>
                <div className="kpi-chart-card__header">
                  <h4>{chart.title}</h4>
                  <p>{chart.subtitle}</p>
                </div>

                <div className="kpi-chart">
                  {chart.points.map((point) => (
                    <div className="kpi-chart__row" key={`${chart.title}-${point.label}`}>
                      <span className="kpi-chart__label">{point.label}</span>
                      <div className="kpi-chart__bar-track">
                        <div
                          className="kpi-chart__bar-fill"
                          style={{ width: `${Math.max((point.value / maxValue) * 100, point.value > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <strong className="kpi-chart__value">
                        {formatKpiValue(point.value, chart.format)}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="Account Overview" eyebrow="Company context">
        <div className="overview-grid">
          <article>
            <span>Company summary</span>
            <p>{report.accountOverview.companySummary}</p>
          </article>
          <article>
            <span>Industry</span>
            <p>{report.accountOverview.industry}</p>
          </article>
          <article>
            <span>Size / footprint</span>
            <p>{report.accountOverview.sizeAndFootprint}</p>
          </article>
          <article>
            <span>Relationship summary</span>
            <p>{report.accountOverview.relationshipSummary}</p>
          </article>
          <article>
            <span>Commercial value</span>
            <p>{report.accountOverview.valueSummary}</p>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Stakeholder Map" eyebrow="Buying committee dynamics">
        <div className="stacked-sections">
          {report.stakeholderMap.participants.map((participant) => (
            <article className="mini-card" key={participant.name}>
              <span>
                {participant.name} • {participant.title}
              </span>
              <p>
                {participant.department} • {participant.influenceLevel} • {participant.relationshipStatus}
              </p>
              <ul>
                {participant.likelyKpis.concat(participant.motivations).map((item) => (
                  <li key={`${participant.name}-${item}`}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="two-column">
          <article className="mini-card">
            <span>Champion candidate</span>
            <p>{report.stakeholderMap.championCandidate}</p>
          </article>
          <article className="mini-card">
            <span>Economic buyer</span>
            <p>{report.stakeholderMap.economicBuyer}</p>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Industry Intelligence" eyebrow="Sector context">
        <div className="two-column">
          <article className="mini-card">
            <span>Current trends</span>
            <ul>
              {report.industryIntelligence.trends.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="mini-card">
            <span>Common formats</span>
            <ul>
              {report.industryIntelligence.commonFormats.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className="two-column">
          <article className="mini-card">
            <span>Typical pain points</span>
            <ul>
              {report.industryIntelligence.painPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="mini-card">
            <span>Regulations / mandates</span>
            <ul>
              {report.industryIntelligence.regulations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        <article className="mini-card">
          <span>Seasonality / market outlook</span>
          <p>{report.industryIntelligence.seasonality}</p>
        </article>
      </SectionCard>

      <SectionCard title="Packaging Opportunity Map" eyebrow="Solution hypotheses">
        <div className="two-column">
          <article className="mini-card">
            <span>Current materials hypothesis</span>
            <ul>
              {report.packagingOpportunity.currentMaterialsHypothesis.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="mini-card">
            <span>Recommended solutions</span>
            <ul>
              {report.packagingOpportunity.recommendedSolutions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className="two-column">
          <article className="mini-card">
            <span>Expected impact</span>
            <ul>
              {report.packagingOpportunity.expectedImpact.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="mini-card">
            <span>Estimated upside</span>
            <p>{report.packagingOpportunity.estimatedUpside}</p>
          </article>
        </div>
        <article className="mini-card">
          <span>Competitive positioning</span>
          <p>{report.packagingOpportunity.competitivePositioning}</p>
        </article>
      </SectionCard>

      <SectionCard title="Recent Activity" eyebrow="Internal signals">
        <InsightList items={report.recentActivity.items} />
      </SectionCard>

      <SectionCard title="Purchase and Product Insights" eyebrow="Commercial fit">
        <div className="chip-row">
          {report.purchaseInsights.topCategories.map((category) => (
            <Badge key={category} tone="neutral">
              {category}
            </Badge>
          ))}
        </div>

        <div className="text-list">
          {report.purchaseInsights.buyingPatterns.map((pattern) => (
            <p key={pattern}>{pattern}</p>
          ))}
        </div>

        <div className="stacked-sections">
          <div>
            <h4>Likely needs</h4>
            <InsightList items={report.purchaseInsights.likelyNeeds} />
          </div>
          <div>
            <h4>Whitespace opportunities</h4>
            <InsightList items={report.purchaseInsights.whitespaceOpportunities} />
          </div>
          <div>
            <h4>Supplier specials</h4>
            <InsightList items={report.purchaseInsights.specials} />
          </div>
          <div>
            <h4>Recommended products</h4>
            <InsightList items={report.purchaseInsights.productRecommendations} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="External Intelligence" eyebrow="Market context">
        <div className="stacked-sections">
          <div>
            <h4>Recent company news</h4>
            <InsightList items={report.externalIntelligence.companyNews} />
          </div>
          <div>
            <h4>Market and packaging trends</h4>
            <InsightList items={report.externalIntelligence.marketTrends} />
          </div>
          <div>
            <h4>External pressures or opportunities</h4>
            <InsightList items={report.externalIntelligence.marketPressures} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recommended Sales Strategy" eyebrow="What the rep should focus on">
        <div className="stacked-sections">
          <div>
            <h4>3 key talking points</h4>
            <InsightList items={report.salesStrategy.keyTalkingPoints} />
          </div>
          <div className="two-column">
            <article className="mini-card">
              <span>Likely priorities</span>
              <ul>
                {report.salesStrategy.likelyPriorities.map((priority) => (
                  <li key={priority}>{priority}</li>
                ))}
              </ul>
            </article>
            <article className="mini-card">
              <span>Best offers / specials to mention</span>
              <ul>
                {report.salesStrategy.offersToMention.map((offer) => (
                  <li key={offer}>{offer}</li>
                ))}
              </ul>
            </article>
          </div>
          <article className="mini-card">
            <span>Recommended sales angle</span>
            <p>{report.salesStrategy.salesAngle}</p>
          </article>
          <article className="mini-card">
            <span>Likely objections or sensitivities</span>
            <ul>
              {report.salesStrategy.objections.map((objection) => (
                <li key={objection}>{objection}</li>
              ))}
            </ul>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Legendary Sales Rep Brain" eyebrow="Synthesis and politics">
        <div className="stacked-sections">
          <article className="mini-card">
            <span>Real problem</span>
            <p>{report.legendarySalesRepBrain.realProblem}</p>
          </article>
          <article className="mini-card">
            <span>Where the economic value lies</span>
            <p>{report.legendarySalesRepBrain.economicValue}</p>
          </article>
          <article className="mini-card">
            <span>Decision dynamic</span>
            <p>{report.legendarySalesRepBrain.decisionDynamic}</p>
          </article>
          <article className="mini-card">
            <span>Potential blockers</span>
            <ul>
              {report.legendarySalesRepBrain.blockers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="mini-card">
            <span>Winning strategy</span>
            <p>{report.legendarySalesRepBrain.winningStrategy}</p>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Challenger Insight" eyebrow="Provocative narrative">
        <div className="stacked-sections">
          <article className="mini-card">
            <span>Narrative</span>
            <p>{report.challengerInsight.narrative}</p>
          </article>
          <article className="mini-card">
            <span>Suggested opening statement</span>
            <p>{report.challengerInsight.openingStatement}</p>
          </article>
          <article className="mini-card">
            <span>Supporting evidence</span>
            <ul>
              {report.challengerInsight.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="mini-card">
            <span>Talking points</span>
            <ul>
              {report.challengerInsight.talkingPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Discovery Plan" eyebrow="Persona-based questions">
        <div className="stacked-sections">
          {report.discoveryPlan.map((group) => (
            <article className="mini-card" key={group.persona}>
              <span>{group.persona}</span>
              <ul>
                {group.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <ol className="question-list">
          {report.discoveryQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard title="Risk Radar" eyebrow="Predicted deal risks">
        <div className="stacked-sections">
          {report.riskRadar.map((item) => (
            <article className="mini-card" key={item.risk}>
              <span>
                {item.risk} • {item.level}
              </span>
              <p>{item.mitigation}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Meeting Goals and Next Best Actions" eyebrow="Desired outcome">
        <div className="two-column">
          <article className="mini-card">
            <span>What success looks like</span>
            <p>{report.goals.successLooksLike}</p>
          </article>
          <article className="mini-card">
            <span>Ideal follow-up</span>
            <p>{report.goals.idealFollowUp}</p>
          </article>
        </div>
        <article className="mini-card">
          <span>Suggested next step after the call</span>
          <p>{report.goals.nextStep}</p>
        </article>
        <article className="mini-card">
          <span>Recommended next move</span>
          <p>{report.recommendedNextMove.bestNextStep}</p>
          <ul>
            {report.recommendedNextMove.alternateNextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <p>{report.recommendedNextMove.rationale}</p>
          <p>{report.recommendedNextMove.worstCaseToAvoid}</p>
        </article>
      </SectionCard>
    </div>
  )
}
