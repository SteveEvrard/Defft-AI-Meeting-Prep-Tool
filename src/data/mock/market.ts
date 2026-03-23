import type { ExternalNewsItem, IndustryTrend } from '../../types/domain'

export const trends: IndustryTrend[] = [
  {
    id: 'trend-001',
    industry: 'Third-Party Logistics',
    title: 'Parcel shippers are standardizing right-size packaging programs',
    summary:
      '3PLs continue to reduce dimensional weight costs by tightening carton assortments and improving pack station consistency.',
    implication:
      'Efficiency and cube optimization discussions will land best when tied to labor and freight savings, not just material price.',
  },
  {
    id: 'trend-002',
    industry: 'Food & Beverage Manufacturing',
    title: 'Retailers are scrutinizing sustainable packaging claims more closely',
    summary:
      'Brands launching recyclable or recycle-ready packs are being pressed for clearer substantiation and better line performance data.',
    implication:
      'Discovery should test whether the customer needs engineering help, compliance support, or speed-to-market support.',
  },
  {
    id: 'trend-003',
    industry: 'Industrial Manufacturing',
    title: 'Packaging teams are balancing resin volatility with damage prevention',
    summary:
      'Industrial accounts are looking for downgauged film and protective packaging changes that do not increase claims.',
    implication:
      'Cost conversations should be framed around total load performance and line uptime, not headline price alone.',
  },
  {
    id: 'trend-004',
    industry: 'Consumer Packaged Goods',
    title: 'Supplier consolidation is accelerating across indirect and packaging categories',
    summary:
      'CPG sourcing teams want fewer vendors that can cover graphics, labels, secondary packaging, and operational supplies.',
    implication:
      'Cross-category breadth is a differentiator when paired with launch coordination and faster turnaround.',
  },
  {
    id: 'trend-005',
    industry: 'Medical Device',
    title: 'Traceability and labeling accuracy remain top investment areas',
    summary:
      'Medtech operations leaders are prioritizing label control, lot visibility, and kit consistency as volumes rise.',
    implication:
      'Conversations should emphasize process control, labeling reliability, and clean operational workflows.',
  },
]

export const news: ExternalNewsItem[] = [
  {
    id: 'news-001',
    accountId: 'acct-verde',
    publishedAt: '2026-02-27',
    headline: 'Verde Organics expands into 1,200 additional grocery doors',
    summary:
      'The company announced broader distribution for two snack lines and highlighted updated shelf-ready packaging in the rollout.',
    impact:
      'Signals urgency around retail compliance, packaging scale-up, and packaging formats that can support merchandising.',
  },
  {
    id: 'news-002',
    accountId: 'acct-summit',
    publishedAt: '2026-02-24',
    headline: 'Summit MedTech wins regional hospital network agreement',
    summary:
      'A new diagnostics supply agreement is expected to increase kit volume over the next two quarters.',
    impact:
      'Creates a near-term need for scalable kit packaging, labeling accuracy, and more disciplined consumables planning.',
  },
  {
    id: 'news-003',
    accountId: 'acct-bright',
    publishedAt: '2026-02-20',
    headline: 'BrightPack announces summer club-store launch',
    summary:
      'The launch includes display-ready multi-packs and a shortened packaging approval timeline for retail partners.',
    impact:
      'Supports a pitch around faster art coordination, custom shippers, and label execution across multiple sites.',
  },
]
