import type {
  Account,
  Contact,
  CrmNote,
  DealStage,
  ExternalNewsItem,
  GeneratedPrepReport,
  IndustryTrend,
  Meeting,
  MockDataRepository,
  ProductCatalogEntry,
  PurchaseOrder,
  QuoteActivity,
  RepContextInput,
  ReportInsight,
  SourceTag,
  SupplierPromotion,
} from '../types/domain'
import { createDefaultInputContext, dealStageLabels } from './meeting-inputs'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const sourceTag = (label: string, type: SourceTag['type']): SourceTag => ({ label, type })

const meetingTypeLabel: Record<Meeting['type'], string> = {
  account_review: 'Account review',
  prospect_discovery: 'Prospect discovery',
  pricing_supply: 'Pricing / supply discussion',
  product_expansion: 'Product expansion',
  operations_alignment: 'Operations alignment',
}

const statusLabel: Record<Account['status'], string> = {
  existing: 'Existing customer',
  prospect: 'Prospect',
}

const stageEmphasisMap: Record<DealStage, { label: string; summary: string }> = {
  first_conversation: {
    label: 'Company and industry intelligence',
    summary: 'Lead with context, relevance, and a strong opening narrative.',
  },
  discovery: {
    label: 'Problem hypotheses and stakeholder motivations',
    summary: 'Prioritize pains, buying dynamics, and structured discovery.',
  },
  solution_discussion: {
    label: 'Packaging opportunity and ROI',
    summary: 'Connect the recommended solution to commercial and operational impact.',
  },
  technical_validation: {
    label: 'Engineering and validation detail',
    summary: 'Focus on fit, standards, integration questions, and proof points.',
  },
  proposal_review: {
    label: 'Financial impact and implementation plan',
    summary: 'Make value and rollout assumptions concrete for approval.',
  },
  negotiation: {
    label: 'Deal probability and objection handling',
    summary: 'Prepare for incumbent defense, objections, and closing pressure.',
  },
  expansion: {
    label: 'Cross-sell and whitespace opportunity',
    summary: 'Use the meeting to widen share and identify the next lane to win.',
  },
}

const groupSpendByCategory = (orders: PurchaseOrder[]) => {
  const totals = new Map<string, number>()

  orders.forEach((order) => {
    totals.set(order.category, (totals.get(order.category) ?? 0) + order.amount)
  })

  return [...totals.entries()].sort((left, right) => right[1] - left[1])
}

const getRelevantPromotions = (
  account: Account,
  promotions: SupplierPromotion[],
  candidateCategories: string[],
) =>
  promotions.filter(
    (promotion) =>
      promotion.targetSegments.includes(account.industry) ||
      candidateCategories.includes(promotion.category),
  )

const getRelevantCatalog = (account: Account, catalog: ProductCatalogEntry[]) =>
  catalog.filter(
    (entry) =>
      entry.bestFitIndustries.includes(account.industry) ||
      account.packagingNeeds.includes(entry.category),
  )

const summarizeContacts = (contacts: Contact[]) =>
  contacts.map((contact) => `${contact.name}, ${contact.role}`).join(' • ')

const makeOrderInsight = (order: PurchaseOrder): ReportInsight => ({
  title: `${order.category} reorder on ${order.orderDate}`,
  detail: `${order.description} for ${order.quantity.toLocaleString()} units at ${currencyFormatter.format(order.amount)}.`,
  sources: [sourceTag('Based on purchasing history', 'purchasing_history')],
  confidence: 'high',
})

const makeNoteInsight = (note: CrmNote): ReportInsight => ({
  title: `CRM note from ${note.author}`,
  detail: note.note,
  sources: [sourceTag('Based on CRM notes', 'crm_note')],
  confidence: 'high',
})

const makeQuoteInsight = (quote: QuoteActivity): ReportInsight => ({
  title: `${quote.status === 'open' ? 'Open' : 'Recent'} quote in ${quote.category}`,
  detail: `${quote.description} valued at ${currencyFormatter.format(quote.value)}.`,
  sources: [sourceTag('Based on quote activity', 'quote_activity')],
  confidence: 'high',
})

const makeTrendInsight = (trend: IndustryTrend): ReportInsight => ({
  title: trend.title,
  detail: `${trend.summary} ${trend.implication}`,
  sources: [sourceTag('Based on industry trend data', 'industry_trend')],
  confidence: 'medium',
})

const makeNewsInsight = (item: ExternalNewsItem): ReportInsight => ({
  title: item.headline,
  detail: `${item.summary} ${item.impact}`,
  sources: [sourceTag('Based on external news', 'external_news')],
  confidence: 'medium',
})

const firstSentence = (value: string) => {
  const sentence = value.split('. ').find(Boolean) ?? value
  return sentence.endsWith('.') ? sentence : `${sentence}.`
}

const summarizeSources = (insight: ReportInsight) =>
  insight.sources
    .map((source) => source.label.replace('Based on ', ''))
    .join(' + ')

const buildSpendActivity = (orders: PurchaseOrder[], meetingStartAt: string) => {
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' })
  const totals = new Map<string, number>()
  const meetingDate = new Date(meetingStartAt)
  const months = Array.from({ length: 4 }, (_, index) => {
    const date = new Date(meetingDate.getFullYear(), meetingDate.getMonth() - (3 - index), 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      label: monthFormatter.format(date),
    }
  })

  orders.forEach((order) => {
    const orderDate = new Date(order.orderDate)
    const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
    totals.set(key, (totals.get(key) ?? 0) + order.amount)
  })

  return months.map((month) => ({
    label: month.label,
    amount: totals.get(month.key) ?? 0,
  }))
}

const sumAmounts = (values: number[]) => values.reduce((total, value) => total + value, 0)

const averageDaysBetweenOrders = (orders: PurchaseOrder[]) => {
  if (orders.length < 2) {
    return null
  }

  const deltas = orders.slice(0, -1).map((order, index) => {
    const current = new Date(order.orderDate).getTime()
    const next = new Date(orders[index + 1].orderDate).getTime()
    return Math.max(Math.round((current - next) / (1000 * 60 * 60 * 24)), 0)
  })

  return Math.round(sumAmounts(deltas) / deltas.length)
}

const buildLast90DaySpend = (orders: PurchaseOrder[], meetingStartAt: string) => {
  const meetingTime = new Date(meetingStartAt).getTime()
  const cutoff = meetingTime - 90 * 24 * 60 * 60 * 1000

  return sumAmounts(
    orders
      .filter((order) => new Date(order.orderDate).getTime() >= cutoff)
      .map((order) => order.amount),
  )
}

const buildExistingQuestions = (account: Account, whitespaceCategories: string[]) => [
  `Where are you feeling the most pressure today: material cost, pack station labor, or service continuity?`,
  `Which SKUs or categories create the most last-minute replenishment risk across ${account.footprint.toLowerCase()}?`,
  `How are you measuring packaging performance today: damage rates, throughput, cube efficiency, or all three?`,
  `What would make it easier for your team to expand beyond the categories we already support?`,
  `Are there any upcoming promotions, launches, or seasonal spikes we should build inventory or specs around now?`,
  `If we could simplify one process this quarter, would you prioritize supply assurance, cost takeout, or operational standardization?`,
  whitespaceCategories[0]
    ? `Would it be useful to evaluate ${whitespaceCategories[0]} alongside your current program so your team can consolidate vendors?`
    : 'What adjacent category would you most want a second source or broader support on this quarter?',
]

const buildProspectQuestions = (account: Account, meeting: Meeting) => [
  `What triggered this ${meetingTypeLabel[meeting.type].toLowerCase()} now, and what has the team already tried?`,
  `Which packaging decisions are most business-critical right now: throughput, retail compliance, sustainability, or cost?`,
  `Where do packaging issues show up today: on the line, in outbound damage, in retailer feedback, or in supplier coordination?`,
  `How do you currently qualify a packaging partner for a new program or rollout?`,
  `What volume changes are you expecting over the next two quarters, and where do you see the most strain?`,
  `Which packaging categories feel stable today, and which ones still need design, sourcing, or process support?`,
  `If this meeting goes well, what would the ideal next working session look like for ${account.name}?`,
]

export const generatePrepReport = (
  meetingId: string,
  repository: MockDataRepository,
  inputContext: RepContextInput = createDefaultInputContext(),
): GeneratedPrepReport => {
  const meeting = repository.meetings.find((item) => item.id === meetingId)

  if (!meeting) {
    throw new Error(`Unknown meeting: ${meetingId}`)
  }

  const account = repository.accounts.find((item) => item.id === meeting.accountId)

  if (!account) {
    throw new Error(`Unknown account for meeting: ${meetingId}`)
  }

  const contacts = repository.contacts.filter((contact) => meeting.contactIds.includes(contact.id))
  const profile = repository.customerProfiles.find((item) => item.accountId === account.id)
  const orders = repository.purchaseOrders
    .filter((order) => order.accountId === account.id)
    .sort((left, right) => right.orderDate.localeCompare(left.orderDate))
  const quotes = repository.quoteActivities
    .filter((quote) => quote.accountId === account.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const notes = repository.crmNotes
    .filter((note) => note.accountId === account.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const opportunities = repository.opportunities.filter((item) => item.accountId === account.id)
  const accountNews = repository.news
    .filter((item) => item.accountId === account.id)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
  const industryTrends = repository.trends.filter((item) => item.industry === account.industry)

  const categorySpend = groupSpendByCategory(orders)
  const topCategories = categorySpend.slice(0, 3).map(([category]) => category)
  const purchasedCategories = new Set(categorySpend.map(([category]) => category))
  const whitespaceCategories = account.packagingNeeds.filter((category) => !purchasedCategories.has(category))
  const relevantPromotions = getRelevantPromotions(account, repository.promotions, [
    ...topCategories,
    ...whitespaceCategories,
  ])
  const relevantCatalog = getRelevantCatalog(account, repository.catalog)
  const openOpportunity = opportunities[0]
  const stageLabel = dealStageLabels[inputContext.dealStage]
  const stageEmphasis = stageEmphasisMap[inputContext.dealStage]
  const customerCareAnswer =
    inputContext.smartAnswers.find((answer) => answer.questionId === 'customer-cares')?.selectedOption ??
    'Not sure yet'
  const triggerAnswer =
    inputContext.smartAnswers.find((answer) => answer.questionId === 'meeting-trigger')?.selectedOption ??
    'Customer request'
  const packagingKnowledge =
    inputContext.smartAnswers.find((answer) => answer.questionId === 'packaging-knowledge')?.selectedOption ??
    'Basic understanding'

  const recentActivityItems: ReportInsight[] = [
    ...orders.slice(0, 2).map(makeOrderInsight),
    ...quotes.slice(0, 1).map(makeQuoteInsight),
    ...notes.slice(0, 2).map(makeNoteInsight),
  ]

  if (profile?.serviceFlags.length) {
    recentActivityItems.push({
      title: 'Service / relationship flag',
      detail: profile.serviceFlags.join(' '),
      sources: [sourceTag('Based on customer profile', 'customer_profile')],
      priority: profile.satisfactionHealth === 'watch' || profile.satisfactionHealth === 'risk' ? 'high' : 'medium',
      confidence: 'high',
    })
  }

  const likelyNeeds: ReportInsight[] =
    account.status === 'existing'
      ? [
          {
            title: 'Protect continuity on core categories',
            detail: `Top spend sits in ${topCategories.slice(0, 2).join(' and ') || 'current packaging categories'}, so the rep should confirm replenishment visibility and any short-term forecast changes before discussing expansion.`,
            sources: [sourceTag('Based on purchasing history', 'purchasing_history')],
            priority: 'high',
            confidence: 'high',
          },
          {
            title: 'Use active demand signals to expand the basket',
            detail: openOpportunity
              ? `There is already commercial momentum around ${openOpportunity.focusAreas.join(' and ')}, which makes adjacent category expansion easier to position as solving an active problem.`
              : 'Recent account activity suggests the team is open to efficiency improvements if the recommendation is operationally concrete.',
            sources: [
              sourceTag(
                openOpportunity ? 'Based on CRM opportunity data' : 'Based on CRM notes',
                openOpportunity ? 'crm_note' : 'crm_note',
              ),
            ],
            priority: 'medium',
            confidence: 'high',
          },
        ]
      : [
          {
            title: 'Lead with business context before product',
            detail: `${account.name} appears to be in a change window, so discovery should focus first on growth pressure, packaging constraints, and qualification criteria before jumping to SKUs.`,
            sources: [
              sourceTag('Based on meeting context', 'calendar_context'),
              sourceTag('Based on external news', 'external_news'),
            ],
            priority: 'high',
            confidence: 'medium',
          },
          {
            title: 'Prioritize the packaging categories most exposed to growth or compliance risk',
            detail: `${account.packagingNeeds.slice(0, 3).join(', ')} are the most likely entry points based on their industry and current signals.`,
            sources: [
              sourceTag('Based on industry trend data', 'industry_trend'),
              sourceTag('Based on supplier catalog data', 'supplier_catalog'),
            ],
            priority: 'high',
            confidence: 'medium',
          },
        ]

  const whitespaceOpportunities = whitespaceCategories.slice(0, 3).map((category) => {
    const catalogMatch = relevantCatalog.find((item) => item.category === category)

    return {
      title: `${category} whitespace opportunity`,
      detail: catalogMatch
        ? `${catalogMatch.productLine} gives the rep a credible expansion angle because ${catalogMatch.positioning.toLowerCase()}`
        : `This category is not currently in the spend mix and can be positioned as a consolidation or performance opportunity.`,
      sources: [
        sourceTag(
          catalogMatch ? 'Based on supplier catalog data' : 'Based on account packaging profile',
          catalogMatch ? 'supplier_catalog' : 'customer_profile',
        ),
      ],
      priority: 'medium',
      confidence: catalogMatch ? 'high' : 'medium',
    } satisfies ReportInsight
  })

  const specials: ReportInsight[] = relevantPromotions.slice(0, 3).map((promotion) => ({
    title: promotion.title,
    detail: `${promotion.summary} Valid through ${promotion.validUntil}.`,
    sources: [sourceTag('Based on supplier promotion data', 'supplier_promotion')],
    priority: 'medium',
    confidence: 'high',
  }))

  const productRecommendations: ReportInsight[] = relevantCatalog
    .slice(0, 3)
    .map((entry) => ({
      title: entry.productLine,
      detail: `${entry.positioning} Best used to open a conversation around ${entry.crossSellWith.join(' and ')}.`,
      sources: [sourceTag('Based on supplier catalog data', 'supplier_catalog')],
      confidence: 'medium',
    }))

  const companyNews = accountNews.slice(0, 2).map(makeNewsInsight)
  const marketTrends = industryTrends.slice(0, 2).map(makeTrendInsight)
  const marketPressures: ReportInsight[] =
    account.status === 'existing'
      ? [
          {
            title: 'Protect margin without sounding transactional',
            detail:
              'The most credible path is to show a commercial upside tied to uptime, labor, or damage reduction rather than defend price line by line.',
            sources: [
              sourceTag('Based on CRM notes', 'crm_note'),
              sourceTag('Based on industry trend data', 'industry_trend'),
            ],
            priority: 'high',
            confidence: 'medium',
          },
        ]
      : [
          {
            title: 'Expect scrutiny on implementation risk',
            detail:
              'Prospects in active growth or compliance windows usually care as much about execution support and transition risk as they do about material specs.',
            sources: [
              sourceTag('Based on external news', 'external_news'),
              sourceTag('Based on industry trend data', 'industry_trend'),
            ],
            priority: 'high',
            confidence: 'medium',
          },
        ]

  const keyTalkingPoints: ReportInsight[] =
    account.status === 'existing'
      ? [
          {
            title: 'Start with operational continuity on current spend',
            detail: `Open by confirming demand outlook for ${topCategories.slice(0, 2).join(' and ')} so the customer sees Defft as proactive on core business before expansion.`,
            sources: [sourceTag('Based on purchasing history', 'purchasing_history')],
            priority: 'high',
            confidence: 'high',
          },
          {
            title: 'Translate current issues into a business case',
            detail: notes[0]
              ? `Tie recommendations back to the latest note: "${notes[0].note}"`
              : 'Anchor recommendations in the last operational issue or active commercial motion.',
            sources: [sourceTag('Based on CRM notes', 'crm_note')],
            priority: 'high',
            confidence: 'high',
          },
          {
            title: 'Use one adjacent category to widen share',
            detail: whitespaceCategories[0]
              ? `Position ${whitespaceCategories[0]} as the most natural next category because it fits both the operating profile and the supplier programs available right now.`
              : 'Use supplier breadth to reinforce vendor consolidation value after the core review.',
            sources: [
              sourceTag('Based on supplier catalog data', 'supplier_catalog'),
              sourceTag('Based on supplier promotion data', 'supplier_promotion'),
            ],
            priority: 'medium',
            confidence: 'medium',
          },
        ]
      : [
          {
            title: 'Lead with relevance to the customer’s current change event',
            detail:
              companyNews[0]?.detail ??
              'Use the meeting to show you understand the external pressure that likely triggered the conversation.',
            sources: [sourceTag('Based on external news', 'external_news')],
            priority: 'high',
            confidence: 'medium',
          },
          {
            title: 'Show vertical fluency, then narrow to one or two packaging bets',
            detail: `For ${account.subIndustry.toLowerCase()}, the most credible opening angles are ${account.packagingNeeds.slice(0, 2).join(' and ')}.`,
            sources: [
              sourceTag('Based on industry trend data', 'industry_trend'),
              sourceTag('Based on supplier catalog data', 'supplier_catalog'),
            ],
            priority: 'high',
            confidence: 'medium',
          },
          {
            title: 'Sell Defft as a practical partner, not just a distributor',
            detail:
              'Emphasize that the team can combine sourcing, packaging guidance, and rollout support if the prospect needs help moving from discovery into execution.',
            sources: [sourceTag('Based on meeting context', 'calendar_context')],
            priority: 'medium',
            confidence: 'medium',
          },
        ]

  const likelyPriorities =
    account.status === 'existing'
      ? [
          'Keep supply consistent on core items',
          'Control cost without increasing damage or labor',
          'Consolidate more spend with fewer vendors',
        ]
      : [
          'Reduce rollout risk on new packaging decisions',
          'Find a partner that understands the vertical',
          'Validate economics and implementation support quickly',
        ]

  const salesAngle =
    account.status === 'existing'
      ? 'Frame the meeting around protecting current business first, then earn the right to expand share with one operationally credible recommendation.'
      : 'Use discovery to prove commercial understanding quickly, then recommend the smallest high-value next step that moves the prospect toward a scoped packaging solution.'

  const offersToMention = specials.map((item) => item.title)
  const objections =
    account.status === 'existing'
      ? ['Price comparison against incumbent or alternate bids', 'Concern about switching processes mid-quarter']
      : ['Reluctance to add a new supplier before requirements are fully defined', 'Concern that sustainable or specialty options may slow production']
  const spendActivity = buildSpendActivity(orders, meeting.startAt)
  const last90DaySpend = buildLast90DaySpend(orders, meeting.startAt)
  const avgOrderValue = orders.length > 0 ? Math.round(sumAmounts(orders.map((order) => order.amount)) / orders.length) : 0
  const cadenceDays = averageDaysBetweenOrders(orders)
  const openQuoteValue = sumAmounts(quotes.filter((quote) => quote.status === 'open').map((quote) => quote.value))
  const totalOpportunityValue = sumAmounts(opportunities.map((opportunity) => opportunity.estimatedValue))
  const quoteStatusChart = [
    {
      label: 'Open',
      value: openQuoteValue,
    },
    {
      label: 'Won',
      value: sumAmounts(quotes.filter((quote) => quote.status === 'won').map((quote) => quote.value)),
    },
    {
      label: 'Lost',
      value: sumAmounts(quotes.filter((quote) => quote.status === 'lost').map((quote) => quote.value)),
    },
    {
      label: 'Pipeline',
      value: totalOpportunityValue,
    },
  ]
  const categoryMixChart =
    account.status === 'existing'
      ? categorySpend.slice(0, 4).map(([category, amount]) => ({
          label: category,
          value: amount,
        }))
      : account.packagingNeeds.slice(0, 4).map((category, index) => ({
          label: category,
          value: [92, 78, 63, 49][index] ?? 35,
        }))
  const kpiMetrics =
    account.status === 'existing'
      ? [
          {
            label: 'Last 90D spend',
            value: currencyFormatter.format(last90DaySpend),
            context: 'Recent purchasing velocity',
          },
          {
            label: 'Avg order value',
            value: currencyFormatter.format(avgOrderValue),
            context: 'Typical order size',
          },
          {
            label: 'Order cadence',
            value: cadenceDays ? `${cadenceDays} days` : 'Limited history',
            context: 'Average time between orders',
          },
          {
            label: 'Open pipeline',
            value: currencyFormatter.format(openQuoteValue + totalOpportunityValue),
            context: 'Quotes and active opportunity value',
          },
        ]
      : [
          {
            label: 'Estimated opportunity',
            value: currencyFormatter.format(account.opportunityPotential ?? totalOpportunityValue),
            context: 'Near-term revenue potential',
          },
          {
            label: 'Pipeline value',
            value: currencyFormatter.format(totalOpportunityValue + openQuoteValue),
            context: 'Active opportunity and quote value',
          },
          {
            label: 'Categories in scope',
            value: `${account.packagingNeeds.length}`,
            context: 'Likely packaging lanes to qualify',
          },
          {
            label: 'Growth signals',
            value: `${accountNews.length + notes.length}`,
            context: 'External and CRM signals in play',
          },
        ]
  const kpiCharts = [
    {
      title: account.status === 'existing' ? 'Recent spend trend' : 'Recent spend baseline',
      subtitle:
        account.status === 'existing'
          ? 'Monthly customer spend from ERP history'
          : 'Prospect has no ERP history yet; baseline remains open',
      format: 'currency' as const,
      points: spendActivity.map((point) => ({
        label: point.label,
        value: point.amount,
      })),
    },
    {
      title: account.status === 'existing' ? 'Category spend mix' : 'In-scope packaging focus',
      subtitle:
        account.status === 'existing'
          ? 'Top categories by recent dollars'
          : 'Highest-priority categories to qualify in discovery',
      format: account.status === 'existing' ? ('currency' as const) : ('count' as const),
      points: categoryMixChart,
    },
    {
      title: 'Quote and pipeline status',
      subtitle: 'Commercial value currently in motion',
      format: 'currency' as const,
      points: quoteStatusChart,
    },
  ]

  const summaryValue =
    account.status === 'existing'
      ? `${currencyFormatter.format(account.accountValue ?? 0)} annualized current spend with ${currencyFormatter.format(account.opportunityPotential ?? 0)} expansion headroom.`
      : `${currencyFormatter.format(account.opportunityPotential ?? 0)} estimated near-term opportunity if discovery converts into a scoped program.`

  const primaryCommercialMove =
    account.status === 'existing'
      ? whitespaceOpportunities[0] ?? specials[0] ?? productRecommendations[0] ?? likelyNeeds[0]
      : productRecommendations[0] ?? specials[0] ?? likelyNeeds[1] ?? likelyNeeds[0]

  const watchoutInsight: ReportInsight =
    account.status === 'existing'
      ? {
          title: 'Likely sensitivity',
          detail:
            objections[0] ??
            'Expect the customer to scrutinize anything that disrupts current operations or pricing stability.',
          sources: [sourceTag('Based on CRM notes', 'crm_note')],
          priority: 'high',
          confidence: 'medium',
        }
      : {
          title: 'Likely sensitivity',
          detail:
            objections[0] ??
            'Expect the prospect to test implementation support and category relevance before engaging on price.',
          sources: [
            sourceTag('Based on external news', 'external_news'),
            sourceTag('Based on industry trend data', 'industry_trend'),
          ],
          priority: 'high',
          confidence: 'medium',
        }

  const priorityHeadline =
    account.status === 'existing'
      ? `Protect the core business first, then widen share into ${whitespaceCategories[0] ?? 'the next adjacent category'}.`
      : `Lead with the business trigger, then qualify the best first packaging lane for ${account.name}.`

  const successLooksLike =
    account.status === 'existing'
      ? 'Leave with updated forecast confidence on current categories, agreement on one operational improvement, and a clear owner for the next expansion step.'
      : 'Leave with the prospect’s top packaging priorities, evaluation criteria, and approval to scope a targeted follow-up session.'

  const idealFollowUp =
    account.status === 'existing'
      ? whitespaceCategories[0]
        ? `Schedule a follow-up review focused on ${whitespaceCategories[0]} and quantify impact with the relevant buyer and operations lead.`
        : 'Schedule a follow-up category review with procurement and operations to quantify the next consolidation opportunity.'
      : 'Book a technical or sourcing follow-up with specs, usage estimates, and stakeholder requirements on the table.'

  const nextStep =
    account.status === 'existing'
      ? 'Send a recap with active quote status, recommended supplier program, and the single expansion opportunity discussed.'
      : 'Send a recap summarizing business needs, recommended starting category, and a proposed working session agenda.'
  const primaryObjective =
    inputContext.dealStage === 'negotiation'
      ? 'Protect position and keep value tied to commercial outcomes.'
      : inputContext.dealStage === 'expansion'
        ? 'Identify the best adjacent category or location to expand into next.'
        : inputContext.dealStage === 'solution_discussion'
          ? 'Validate the most relevant packaging solution path and expected business impact.'
          : 'Diagnose the business problem driving the meeting and align on the right next step.'
  const secondaryObjective =
    account.status === 'existing'
      ? 'Strengthen stakeholder alignment and leave with a committed owner.'
      : 'Build credibility quickly and qualify the buying process.'
  const expectedOutcome =
    inputContext.dealStage === 'technical_validation'
      ? 'Secure a technical validation step, test, or workflow review.'
      : inputContext.dealStage === 'proposal_review'
        ? 'Align on commercial impact, rollout assumptions, and approvals.'
        : inputContext.dealStage === 'expansion'
          ? 'Confirm the next expansion motion, category, or location.'
          : 'Leave with a specific follow-up work session or audit on the calendar.'
  const opportunityScoreValue =
    account.status === 'existing'
      ? Math.min(
          92,
          55 + Math.round((account.opportunityPotential ?? 0) / 10000) + whitespaceCategories.length * 4,
        )
      : Math.min(
          88,
          48 + Math.round((account.opportunityPotential ?? 0) / 15000) + account.packagingNeeds.length * 4,
        )
  const dealProbabilityValue =
    inputContext.dealStage === 'negotiation'
      ? account.status === 'existing'
        ? 71
        : 46
      : inputContext.dealStage === 'proposal_review'
        ? account.status === 'existing'
          ? 64
          : 42
        : account.status === 'existing'
          ? 58
          : 34
  const confidenceLevel =
    notes.length + orders.length + accountNews.length >= 5
      ? 'High'
      : notes.length + accountNews.length >= 3
        ? 'Medium'
        : 'Low'
  return {
    meetingId: meeting.id,
    generatedAt: new Date().toISOString(),
    compactSummary:
      account.status === 'existing'
        ? `${account.name} is an active customer with meaningful spend in ${topCategories.slice(0, 2).join(' and ')}. The best meeting outcome is to reinforce supply confidence on current business and open a concrete path into ${whitespaceCategories[0] ?? 'adjacent categories'}.`
        : `${account.name} is a qualified prospect in a live change window. The best meeting outcome is to uncover qualification criteria, map immediate packaging pressure points, and secure a focused follow-up around the highest-value category.`,
    inputContext,
    stageFocus: {
      stageLabel,
      emphasisLabel: stageEmphasis.label,
      emphasisSummary: stageEmphasis.summary,
    },
    priorityBrief: {
      headline: priorityHeadline,
      subheadline:
        account.status === 'existing'
          ? `This is an ${meetingTypeLabel[meeting.type].toLowerCase()} with an existing customer. Keep the conversation anchored in current spend, operational pressure, and one credible expansion move.`
          : `This is a ${meetingTypeLabel[meeting.type].toLowerCase()} with a prospect. Win the meeting by proving you understand the trigger, the risk, and the fastest path to value.`,
      items: [
        {
          label: 'Open with',
          title: keyTalkingPoints[0].title,
          bullets:
            account.status === 'existing'
              ? [
                  `Confirm outlook and replenishment confidence for ${topCategories.slice(0, 2).join(' and ')}.`,
                  notes[0]
                    ? firstSentence(notes[0].note)
                    : 'Reinforce that you are reviewing current business before proposing changes.',
                  'Use the first five minutes to establish operational credibility, not price defense.',
                ]
              : [
                  accountNews[0]
                    ? firstSentence(`${accountNews[0].summary} ${accountNews[0].impact}`)
                    : 'Acknowledge the business trigger behind the meeting early.',
                  `Ask why ${account.packagingNeeds.slice(0, 2).join(' and ')} are the right starting categories now.`,
                  'Show that you understand the vertical before moving into product talk.',
                ],
          sourceSummary: summarizeSources(keyTalkingPoints[0]),
        },
        {
          label: 'What matters most',
          title: likelyNeeds[0].title,
          bullets:
            account.status === 'existing'
              ? [
                  'Protect continuity on core categories before introducing a new lane.',
                  `Tie the conversation to ${likelyPriorities[0].toLowerCase()} and ${likelyPriorities[1].toLowerCase()}.`,
                  openOpportunity
                    ? `Use the active opportunity in ${openOpportunity.focusAreas.join(' and ')} as proof of current demand.`
                    : 'Look for one active pain point that gives you permission to expand the conversation.',
                ]
              : [
                  'Identify the operational or commercial trigger behind the evaluation.',
                  'Qualify packaging risk, implementation risk, and decision criteria in the same conversation.',
                  `${account.packagingNeeds.slice(0, 3).join(', ')} are the most likely high-value categories to validate first.`,
                ],
          sourceSummary: summarizeSources(likelyNeeds[0]),
        },
        {
          label: 'Commercial move',
          title: primaryCommercialMove.title,
          bullets: [
            firstSentence(primaryCommercialMove.detail),
            specials[0]
              ? `Mention ${specials[0].title.toLowerCase()} if the customer is open to a next step.`
              : 'Offer a practical next step tied to one measurable packaging improvement.',
            account.status === 'existing'
              ? 'Position this as an adjacent share-of-wallet move, not a broad reset.'
              : 'Position this as the smallest credible first win, not a full-line conversion.',
          ],
          sourceSummary: summarizeSources(primaryCommercialMove),
        },
        {
          label: 'Watch for',
          title: watchoutInsight.title,
          bullets: [
            firstSentence(watchoutInsight.detail),
            account.status === 'existing'
              ? 'Be ready to defend value with uptime, labor, or service logic instead of unit price alone.'
              : 'Expect the prospect to probe transition support before committing to a follow-up.',
            profile?.serviceFlags[0]
              ? firstSentence(profile.serviceFlags[0])
              : 'Watch for anything that signals timing or implementation friction.',
          ],
          sourceSummary: summarizeSources(watchoutInsight),
        },
      ],
      meetingGoals:
        account.status === 'existing'
          ? [
              `Confirm forecast confidence on ${topCategories.slice(0, 2).join(' and ')}.`,
              'Align on one operational improvement or commercial opening.',
              'Leave with a named owner and follow-up for the next expansion step.',
            ]
          : [
              'Uncover the top packaging priorities and decision criteria.',
              'Agree on the best first category or use case to scope.',
              'Secure a focused technical or sourcing follow-up session.',
            ],
      spendActivity,
    },
    kpis: {
      metrics: kpiMetrics,
      charts: kpiCharts,
    },
    meetingObjective: {
      meetingType: stageLabel,
      primaryObjective,
      secondaryObjective,
      expectedOutcome,
      agenda: [
        { topic: 'Open with business context and objective', duration: '5 min' },
        { topic: `Discuss ${customerCareAnswer.toLowerCase()} and current trigger`, duration: '10 min' },
        { topic: 'Explore stakeholders and qualification gaps', duration: '10 min' },
        { topic: 'Align on next step and owner', duration: '5 min' },
      ],
    },
    opportunityScore: {
      score: opportunityScoreValue,
      keyDrivers: [
        `${account.employeeRange} footprint with ${account.packagingNeeds.length} packaging lanes in scope`,
        triggerAnswer,
        customerCareAnswer,
      ],
      riskFactors: [...account.strategicFlags.slice(0, 2), objections[0]],
      territoryComparison:
        account.status === 'existing'
          ? 'Above-average expansion potential versus similar active accounts due to whitespace and account access.'
          : 'Comparable to strong net-new opportunities when a clear trigger and executive interest are present.',
    },
    dealProbability: {
      winLikelihood: dealProbabilityValue,
      timeline:
        inputContext.dealStage === 'negotiation'
          ? '2-4 weeks'
          : inputContext.dealStage === 'proposal_review'
            ? '3-6 weeks'
            : '4-10 weeks',
      confidence: confidenceLevel,
      positiveDrivers: [
        triggerAnswer,
        customerCareAnswer,
        account.status === 'existing' ? 'Existing account access' : 'Live qualification window',
      ],
      negativeDrivers: [
        objections[0],
        packagingKnowledge === 'Nothing yet' ? 'Limited packaging detail today' : 'Some assumptions still need validation',
      ],
    },
    snapshot: {
      meetingTitle: meeting.title,
      companyName: account.name,
      contactSummary: summarizeContacts(contacts),
      meetingTime: dateTimeFormatter.format(new Date(meeting.startAt)),
      purpose: meeting.purpose,
      meetingType: meetingTypeLabel[meeting.type],
      customerStatus: statusLabel[account.status],
    },
    accountOverview: {
      companySummary: account.summary,
      industry: `${account.industry} • ${account.subIndustry}`,
      sizeAndFootprint: `${account.employeeRange} • ${account.footprint}`,
      relationshipSummary:
        account.status === 'existing'
          ? `${account.relationshipSummary} ${profile ? `Health: ${profile.satisfactionHealth}. Contract: ${profile.contractStatus}.` : ''}`
          : account.relationshipSummary,
      valueSummary: summaryValue,
    },
    stakeholderMap: {
      participants: contacts.map((contact, index) => ({
        name: contact.name,
        title: contact.role,
        department:
          /procurement|sourcing/i.test(contact.role)
            ? 'Procurement'
            : /engineer/i.test(contact.role)
              ? 'Engineering'
              : 'Operations',
        influenceLevel: index === 0 ? 'Decision maker / key influencer' : 'Evaluator / influencer',
        relationshipStatus:
          account.status === 'existing' ? (index === 0 ? 'Supporter' : 'Neutral') : 'New',
        likelyKpis:
          /procurement|sourcing/i.test(contact.role)
            ? ['Cost per shipment', 'Supplier reliability']
            : /engineer/i.test(contact.role)
              ? ['Pack integrity', 'Spec fit', 'Line compatibility']
              : ['Packing throughput', 'Damage rate', 'Labor efficiency'],
        motivations: [customerCareAnswer, ...account.strategicFlags.slice(0, 1)],
      })),
      championCandidate: contacts[0]?.name ?? 'To be identified',
      economicBuyer:
        contacts.find((contact) => /vp|director|lead|procurement|sourcing/i.test(contact.role))?.name ??
        contacts[0]?.name ??
        'To be confirmed',
    },
    industryIntelligence: {
      trends: industryTrends.map((trend) => trend.title),
      commonFormats: relevantCatalog.slice(0, 3).map((entry) => entry.productLine),
      painPoints: [customerCareAnswer, ...industryTrends.slice(0, 2).map((trend) => trend.implication)],
      regulations:
        account.industry === 'Food & Beverage Manufacturing'
          ? ['Retail packaging compliance', 'Sustainability claim substantiation']
          : account.industry === 'Medical Device'
            ? ['Traceability requirements', 'Labeling accuracy expectations']
            : ['Recyclability pressure', 'Carrier and freight compliance'],
      seasonality:
        account.strategicFlags[0] ??
        'Watch for seasonality, volume spikes, and operational constraints across the account.',
    },
    packagingOpportunity: {
      currentMaterialsHypothesis:
        account.status === 'existing' ? topCategories : account.packagingNeeds.slice(0, 3),
      recommendedSolutions: relevantCatalog.slice(0, 3).map((entry) => entry.productLine),
      expectedImpact: [
        customerCareAnswer,
        account.status === 'existing' ? 'Lower-friction category expansion' : 'Faster path to a scoped pilot or audit',
        ...specials.slice(0, 1).map((item) => item.title),
      ],
      estimatedUpside: summaryValue,
      competitivePositioning:
        account.status === 'existing'
          ? 'Defft can position against incumbents by combining continuity on current categories with a credible expansion path.'
          : 'Defft should position as a practical packaging partner with sourcing, guidance, and rollout support rather than a commodity supplier.',
    },
    legendarySalesRepBrain: {
      realProblem:
        account.status === 'existing'
          ? `The stated issue is ${triggerAnswer.toLowerCase()}, but the real problem is protecting service and economics without adding operational friction.`
          : `The stated issue is ${triggerAnswer.toLowerCase()}, but the real problem is reducing execution risk while choosing the right packaging path.`,
      economicValue:
        customerCareAnswer === 'Damage reduction'
          ? 'Economic value sits in lower claims, fewer reships, and stronger service performance.'
          : customerCareAnswer === 'Automation'
            ? 'Economic value sits in labor efficiency, throughput, and operating consistency.'
            : `Economic value sits in ${customerCareAnswer.toLowerCase()} translated into measurable business outcomes.`,
      decisionDynamic:
        contacts.length > 1
          ? 'Multiple buying committee voices are likely present, so align operations and procurement interests early.'
          : 'Participant list is narrow, so identify who else influences budget or approval.',
      blockers: [objections[0], ...account.strategicFlags.slice(0, 2)],
      winningStrategy: salesAngle,
    },
    challengerInsight: {
      narrative:
        customerCareAnswer === 'Cost reduction'
          ? 'Most buyers focus on unit price first, but the bigger leakage often lives in labor, damages, and process inconsistency.'
          : 'Many teams describe packaging in material terms, but the stronger commercial story is how packaging affects throughput, service, and supplier leverage.',
      evidence: [
        ...industryTrends.slice(0, 2).map((trend) => trend.summary),
        ...accountNews.slice(0, 1).map((newsItem) => newsItem.impact),
      ],
      openingStatement:
        account.status === 'existing'
          ? 'Before we talk about new options, I want to pressure-test where the current packaging program is creating the most drag.'
          : 'The bigger risk is not picking the wrong product, it is solving the wrong packaging problem first.',
      talkingPoints: keyTalkingPoints.map((item) => item.detail),
    },
    discoveryPlan: [
      {
        persona: 'Operations',
        questions: [
          'What is your current packing throughput per station or shift?',
          'Where do packaging issues show up most often in the workflow today?',
        ],
      },
      {
        persona: 'Procurement',
        questions: [
          'How do you measure packaging cost per shipment today?',
          'What does approval look like if we identify a packaging change worth testing?',
        ],
      },
      {
        persona: 'Engineering',
        questions: [
          'Are there spec, testing, or integration requirements that narrow the solution set?',
          'Which packaging validations matter most for this program?',
        ],
      },
      {
        persona: 'Sustainability',
        questions: [
          'What waste reduction or recyclability goals are already in motion?',
          'How do you balance sustainability targets against performance and cost?',
        ],
      },
    ],
    riskRadar: [
      {
        risk: objections[0],
        level: 'High',
        mitigation: 'Anchor the recommendation in total business impact and validate a low-friction next step.',
      },
      {
        risk: packagingKnowledge === 'Nothing yet' ? 'Limited packaging detail' : 'Some assumptions still need validation',
        level: 'Medium',
        mitigation: 'Use structured discovery to confirm current materials, workflow, and qualification criteria.',
      },
      {
        risk: account.strategicFlags[0] ?? 'Timing or stakeholder alignment may stall progress',
        level: 'Medium',
        mitigation: 'End the meeting with a named owner, timeline, and specific follow-up action.',
      },
    ],
    recommendedNextMove: {
      bestNextStep:
        inputContext.dealStage === 'technical_validation'
          ? 'Book a technical validation session with specs, workflow data, and testing requirements.'
          : inputContext.dealStage === 'expansion'
            ? 'Schedule a focused expansion review on the highest-priority adjacent category.'
            : inputContext.dealStage === 'proposal_review'
              ? 'Review financial impact, rollout assumptions, and approval steps with the decision team.'
              : 'Schedule a packaging audit or scoped follow-up working session tied to the primary pain point.',
      alternateNextSteps: [
        'Run a packaging test or sample evaluation',
        'Book executive or procurement alignment if approvals are still unclear',
      ],
      rationale:
        'The next move should increase deal certainty by turning the conversation into a scoped, decision-oriented follow-up.',
      worstCaseToAvoid:
        'A vague follow-up without a defined objective, owner, or decision milestone.',
    },
    recentActivity: {
      items: recentActivityItems,
    },
    purchaseInsights: {
      topCategories:
        account.status === 'existing'
          ? topCategories
          : account.packagingNeeds.slice(0, 3),
      buyingPatterns:
        account.status === 'existing'
          ? [
              `Recent spend is concentrated in ${topCategories.slice(0, 2).join(' and ') || 'a small number of categories'}.`,
              `Most recent order was ${orders[0] ? `${orders[0].orderDate} for ${orders[0].category}` : 'not available in the ERP mock data'}.`,
              openOpportunity
                ? `Active commercial motion exists in ${openOpportunity.focusAreas.join(' and ')}.`
                : 'No active opportunity is currently staged.',
            ]
          : [
              `${account.name} likely needs support across ${account.packagingNeeds.slice(0, 3).join(', ')} based on company profile and industry context.`,
              'Discovery should validate line constraints, compliance requirements, and preferred supplier model before narrowing product fit.',
            ],
      likelyNeeds,
      whitespaceOpportunities,
      specials,
      productRecommendations,
    },
    externalIntelligence: {
      companyNews,
      marketTrends,
      marketPressures,
    },
    salesStrategy: {
      keyTalkingPoints,
      likelyPriorities,
      salesAngle,
      offersToMention,
      objections,
    },
    discoveryQuestions:
      account.status === 'existing'
        ? buildExistingQuestions(account, whitespaceCategories)
        : buildProspectQuestions(account, meeting),
    goals: {
      successLooksLike,
      idealFollowUp,
      nextStep,
    },
  }
}
