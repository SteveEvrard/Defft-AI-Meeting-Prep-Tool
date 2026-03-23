import type { Account, Contact, Meeting } from '../types/domain'

const COMPANY_BRIEF_ENDPOINT = import.meta.env.VITE_COMPANY_BRIEF_ENDPOINT?.trim()

export interface CompanySnapshot {
  companyName: string
  domain?: string
  websiteUrl?: string
  logoUrl?: string
  sourceLabel: string
  headline: string
  summary: string
  meetingGoal: string
  talkingPoints: string[]
}

interface CompanySnapshotResponse {
  headline?: string
  logoUrl?: string
  meetingGoal?: string
  sourceLabel?: string
  summary?: string
  talkingPoints?: string[]
  websiteUrl?: string
}

const normalizeDomain = (value?: string) => value?.trim().toLowerCase() ?? ''

const isLikelyBusinessDomain = (domain: string) =>
  Boolean(domain) && !['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'].includes(domain)

const extractPrimaryDomain = (contacts: Contact[]) => {
  const domains = contacts
    .map((contact) => normalizeDomain(contact.email.split('@')[1]))
    .filter(isLikelyBusinessDomain)

  return domains[0] || undefined
}

const firstSentence = (value: string) => {
  const sentence = value
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s/)[0]

  return sentence?.trim() || value.trim()
}

const buildGoal = (meeting: Meeting, account: Account) => {
  const haystack = `${meeting.title} ${meeting.purpose}`.toLowerCase()

  if (/(review|qbr|renewal|account review)/.test(haystack)) {
    return `Confirm ${account.name}'s priorities and leave with one clear follow-up.`
  }

  if (/(pricing|supply|cost|vendor)/.test(haystack)) {
    return `Clarify cost or supply pressure and align on the next evaluation step.`
  }

  if (/(expand|launch|cross-sell|upsell|new sku)/.test(haystack)) {
    return `Understand the growth trigger and lock a focused working session.`
  }

  return `Confirm why this meeting matters now and secure a specific next step.`
}

const buildTalkingPoints = (meeting: Meeting, account: Account, contacts: Contact[]) => {
  const primaryContact = contacts[0]

  return [
    `Start with why "${meeting.title}" is happening now for ${account.name}.`,
    primaryContact
      ? `Use ${primaryContact.name} as the anchor and confirm who else shapes the decision.`
      : 'Confirm the decision owner and who should join the next step.',
    `Close with a next step tied to ${firstSentence(meeting.purpose).toLowerCase()}`,
  ]
}

export const buildFallbackCompanySnapshot = (
  meeting: Meeting,
  account: Account,
  contacts: Contact[],
): CompanySnapshot => {
  const domain = extractPrimaryDomain(contacts)

  return {
    companyName: account.name,
    domain,
    websiteUrl: domain ? `https://${domain}` : undefined,
    logoUrl: domain ? `https://logo.clearbit.com/${domain}` : undefined,
    sourceLabel: domain ? 'Domain + meeting context' : 'Meeting context',
    headline: `${account.name} is the company linked to this meeting.`,
    summary: domain
      ? `Matched from contacts using ${domain}.`
      : 'Matched from the meeting title and participants.',
    meetingGoal: buildGoal(meeting, account),
    talkingPoints: buildTalkingPoints(meeting, account, contacts),
  }
}

export const loadCompanySnapshot = async (
  meeting: Meeting,
  account: Account,
  contacts: Contact[],
): Promise<CompanySnapshot> => {
  const fallback = buildFallbackCompanySnapshot(meeting, account, contacts)

  if (!COMPANY_BRIEF_ENDPOINT) {
    return fallback
  }

  const params = new URLSearchParams({
    companyName: account.name,
    contactEmails: contacts.map((contact) => contact.email).join(','),
    domain: fallback.domain ?? '',
    meetingPurpose: meeting.purpose,
    meetingTitle: meeting.title,
  })

  try {
    const response = await fetch(`${COMPANY_BRIEF_ENDPOINT}?${params.toString()}`)

    if (!response.ok) {
      return fallback
    }

    const payload = (await response.json()) as CompanySnapshotResponse

    return {
      ...fallback,
      headline: payload.headline ?? fallback.headline,
      logoUrl: payload.logoUrl ?? fallback.logoUrl,
      meetingGoal: payload.meetingGoal ?? fallback.meetingGoal,
      sourceLabel: payload.sourceLabel ?? 'AI + service enrichment',
      summary: payload.summary ?? fallback.summary,
      talkingPoints:
        payload.talkingPoints && payload.talkingPoints.length > 0
          ? payload.talkingPoints.slice(0, 3)
          : fallback.talkingPoints,
      websiteUrl: payload.websiteUrl ?? fallback.websiteUrl,
    }
  } catch {
    return fallback
  }
}
