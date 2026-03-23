export type AccountStatus = 'existing' | 'prospect'

export type MeetingType =
  | 'account_review'
  | 'prospect_discovery'
  | 'pricing_supply'
  | 'product_expansion'
  | 'operations_alignment'

export type DealStage =
  | 'first_conversation'
  | 'discovery'
  | 'solution_discussion'
  | 'technical_validation'
  | 'proposal_review'
  | 'negotiation'
  | 'expansion'

export type InsightSourceType =
  | 'purchasing_history'
  | 'supplier_promotion'
  | 'external_news'
  | 'crm_note'
  | 'quote_activity'
  | 'industry_trend'
  | 'customer_profile'
  | 'calendar_context'
  | 'supplier_catalog'

export interface Meeting {
  id: string
  title: string
  startAt: string
  durationMinutes: number
  type: MeetingType
  purpose: string
  accountId: string
  contactIds: string[]
  ownerName: string
  location: string
  integrationSource: string
  agendaTags: string[]
}

export interface Account {
  id: string
  name: string
  status: AccountStatus
  industry: string
  subIndustry: string
  employeeRange: string
  footprint: string
  summary: string
  relationshipSummary: string
  accountValue?: number
  opportunityPotential?: number
  existingCustomerSince?: string
  strategicFlags: string[]
  packagingNeeds: string[]
}

export interface Contact {
  id: string
  accountId: string
  name: string
  role: string
  email: string
  phone: string
  priority: 'primary' | 'secondary'
}

export interface CustomerProfile {
  accountId: string
  satisfactionHealth: 'green' | 'watch' | 'risk'
  paymentTerms: string
  preferredOrderingChannel: string
  contractStatus: string
  serviceFlags: string[]
  strategicPriorities: string[]
}

export interface PurchaseOrder {
  id: string
  accountId: string
  orderDate: string
  category: string
  sku: string
  description: string
  quantity: number
  amount: number
}

export interface QuoteActivity {
  id: string
  accountId: string
  status: 'open' | 'won' | 'lost'
  createdAt: string
  category: string
  description: string
  value: number
}

export interface CrmNote {
  id: string
  accountId: string
  createdAt: string
  author: string
  note: string
  tags: string[]
}

export interface Opportunity {
  id: string
  accountId: string
  name: string
  stage: string
  estimatedValue: number
  closeDate: string
  focusAreas: string[]
}

export interface SupplierPromotion {
  id: string
  supplierName: string
  category: string
  title: string
  summary: string
  validUntil: string
  offerType: string
  targetSegments: string[]
}

export interface ProductCatalogEntry {
  id: string
  category: string
  productLine: string
  positioning: string
  bestFitIndustries: string[]
  crossSellWith: string[]
}

export interface IndustryTrend {
  id: string
  industry: string
  title: string
  summary: string
  implication: string
}

export interface ExternalNewsItem {
  id: string
  accountId: string
  publishedAt: string
  headline: string
  summary: string
  impact: string
}

export interface SourceTag {
  type: InsightSourceType
  label: string
}

export interface ReportInsight {
  title: string
  detail: string
  sources: SourceTag[]
  priority?: 'high' | 'medium' | 'low'
  confidence?: 'high' | 'medium'
}

export interface MeetingSnapshot {
  meetingTitle: string
  companyName: string
  contactSummary: string
  meetingTime: string
  purpose: string
  meetingType: string
  customerStatus: string
}

export interface AccountOverviewSection {
  companySummary: string
  industry: string
  sizeAndFootprint: string
  relationshipSummary: string
  valueSummary: string
}

export interface RecentActivitySection {
  items: ReportInsight[]
}

export interface PurchaseProductSection {
  topCategories: string[]
  buyingPatterns: string[]
  likelyNeeds: ReportInsight[]
  whitespaceOpportunities: ReportInsight[]
  specials: ReportInsight[]
  productRecommendations: ReportInsight[]
}

export interface ExternalIntelligenceSection {
  companyNews: ReportInsight[]
  marketTrends: ReportInsight[]
  marketPressures: ReportInsight[]
}

export interface SalesStrategySection {
  keyTalkingPoints: ReportInsight[]
  likelyPriorities: string[]
  salesAngle: string
  offersToMention: string[]
  objections: string[]
}

export interface MeetingGoalsSection {
  successLooksLike: string
  idealFollowUp: string
  nextStep: string
}

export interface SmartQuestionAnswer {
  questionId: 'customer-cares' | 'meeting-trigger' | 'packaging-knowledge'
  selectedOption: string
  otherText?: string
}

export interface RepContextInput {
  dealStage: DealStage
  smartAnswers: SmartQuestionAnswer[]
  dealSizeBand: 'unknown' | '<50k' | '50k-250k' | '250k-1m' | '>1m'
  relationshipStrength: 'new' | 'early' | 'existing' | 'strong'
}

export interface ReportKpiMetric {
  label: string
  value: string
  context: string
}

export interface ReportKpiChartPoint {
  label: string
  value: number
}

export interface ReportKpiChart {
  title: string
  subtitle: string
  format: 'currency' | 'count' | 'days'
  points: ReportKpiChartPoint[]
}

export interface ReportKpiSection {
  metrics: ReportKpiMetric[]
  charts: ReportKpiChart[]
}

export interface StageFocusSection {
  stageLabel: string
  emphasisLabel: string
  emphasisSummary: string
}

export interface MeetingObjectiveSection {
  meetingType: string
  primaryObjective: string
  secondaryObjective: string
  expectedOutcome: string
  agenda: Array<{ topic: string; duration: string }>
}

export interface OpportunityScoreSection {
  score: number
  keyDrivers: string[]
  riskFactors: string[]
  territoryComparison: string
}

export interface DealProbabilitySection {
  winLikelihood: number
  timeline: string
  confidence: 'High' | 'Medium' | 'Low'
  positiveDrivers: string[]
  negativeDrivers: string[]
}

export interface StakeholderPerson {
  name: string
  title: string
  department: string
  influenceLevel: string
  relationshipStatus: string
  likelyKpis: string[]
  motivations: string[]
}

export interface StakeholderMapSection {
  participants: StakeholderPerson[]
  championCandidate: string
  economicBuyer: string
}

export interface IndustryIntelligenceSection {
  trends: string[]
  commonFormats: string[]
  painPoints: string[]
  regulations: string[]
  seasonality: string
}

export interface PackagingOpportunitySection {
  currentMaterialsHypothesis: string[]
  recommendedSolutions: string[]
  expectedImpact: string[]
  estimatedUpside: string
  competitivePositioning: string
}

export interface LegendarySalesRepBrainSection {
  realProblem: string
  economicValue: string
  decisionDynamic: string
  blockers: string[]
  winningStrategy: string
}

export interface ChallengerInsightSection {
  narrative: string
  evidence: string[]
  openingStatement: string
  talkingPoints: string[]
}

export interface DiscoveryPlanPersonaGroup {
  persona: string
  questions: string[]
}

export interface RiskRadarItem {
  risk: string
  level: 'Low' | 'Medium' | 'High'
  mitigation: string
}

export interface RecommendedNextMoveSection {
  bestNextStep: string
  alternateNextSteps: string[]
  rationale: string
  worstCaseToAvoid: string
}

export interface PriorityBriefItem {
  label: string
  title: string
  bullets: string[]
  sourceSummary?: string
}

export interface SpendActivityPoint {
  label: string
  amount: number
}

export interface PriorityBriefSection {
  headline: string
  subheadline: string
  items: PriorityBriefItem[]
  meetingGoals: string[]
  spendActivity: SpendActivityPoint[]
}

export interface GeneratedPrepReport {
  meetingId: string
  generatedAt: string
  compactSummary: string
  inputContext: RepContextInput
  stageFocus: StageFocusSection
  priorityBrief: PriorityBriefSection
  kpis: ReportKpiSection
  meetingObjective: MeetingObjectiveSection
  opportunityScore: OpportunityScoreSection
  dealProbability: DealProbabilitySection
  snapshot: MeetingSnapshot
  accountOverview: AccountOverviewSection
  stakeholderMap: StakeholderMapSection
  industryIntelligence: IndustryIntelligenceSection
  packagingOpportunity: PackagingOpportunitySection
  legendarySalesRepBrain: LegendarySalesRepBrainSection
  challengerInsight: ChallengerInsightSection
  discoveryPlan: DiscoveryPlanPersonaGroup[]
  riskRadar: RiskRadarItem[]
  recommendedNextMove: RecommendedNextMoveSection
  recentActivity: RecentActivitySection
  purchaseInsights: PurchaseProductSection
  externalIntelligence: ExternalIntelligenceSection
  salesStrategy: SalesStrategySection
  discoveryQuestions: string[]
  goals: MeetingGoalsSection
}

export interface MockDataRepository {
  meetings: Meeting[]
  accounts: Account[]
  contacts: Contact[]
  customerProfiles: CustomerProfile[]
  purchaseOrders: PurchaseOrder[]
  quoteActivities: QuoteActivity[]
  crmNotes: CrmNote[]
  opportunities: Opportunity[]
  promotions: SupplierPromotion[]
  catalog: ProductCatalogEntry[]
  trends: IndustryTrend[]
  news: ExternalNewsItem[]
}
