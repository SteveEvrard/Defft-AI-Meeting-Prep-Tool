import type { AuthUser } from './auth'
import type { Account, Contact, Meeting, MeetingType, MockDataRepository } from '../types/domain'

interface GoogleCalendarDateTime {
  date?: string
  dateTime?: string
}

interface GoogleCalendarAttendee {
  displayName?: string
  email?: string
  resource?: boolean
  self?: boolean
}

interface GoogleCalendarEvent {
  attendees?: GoogleCalendarAttendee[]
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string
      label?: string
      uri?: string
    }>
  }
  description?: string
  end?: GoogleCalendarDateTime
  hangoutLink?: string
  id: string
  location?: string
  organizer?: {
    displayName?: string
    email?: string
  }
  start?: GoogleCalendarDateTime
  status?: string
  summary?: string
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEvent[]
}

const DEFAULT_PACKAGING_NEEDS: Record<MeetingType, string[]> = {
  account_review: ['Corrugated', 'Stretch film', 'Labels'],
  operations_alignment: ['Protective packaging', 'Labels', 'Workflow supplies'],
  pricing_supply: ['Stretch film', 'Poly mailers', 'Tape'],
  product_expansion: ['Labels', 'Custom shippers', 'Retail packaging'],
  prospect_discovery: ['Protective packaging', 'Corrugated', 'Labels'],
}

export const emptyRepository: MockDataRepository = {
  meetings: [],
  accounts: [],
  contacts: [],
  customerProfiles: [],
  purchaseOrders: [],
  quoteActivities: [],
  crmNotes: [],
  opportunities: [],
  promotions: [],
  catalog: [],
  trends: [],
  news: [],
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const extractDomain = (email?: string) => email?.split('@')[1]?.toLowerCase() ?? null

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

const stripTopLevelDomain = (domain: string) => domain.replace(/\.[^.]+$/, '')

const deriveCompanyName = (domain: string | null, summary: string) => {
  if (!domain) {
    return summary || 'Calendar Meeting'
  }

  const parts = stripTopLevelDomain(domain)
    .split('.')
    .filter(Boolean)

  return titleCase(parts[parts.length - 1] ?? domain)
}

const inferMeetingType = (summary: string, description: string): MeetingType => {
  const haystack = `${summary} ${description}`.toLowerCase()

  if (/(price|pricing|cost|supply|vendor|rate)/.test(haystack)) {
    return 'pricing_supply'
  }

  if (/(expand|expansion|cross-sell|upsell|launch|new sku)/.test(haystack)) {
    return 'product_expansion'
  }

  if (/(operation|workflow|plant|line|facility|process)/.test(haystack)) {
    return 'operations_alignment'
  }

  if (/(review|qbr|quarterly|renewal|business review|account review)/.test(haystack)) {
    return 'account_review'
  }

  return 'prospect_discovery'
}

const inferAccountStatus = (summary: string, description: string): Account['status'] =>
  /(review|qbr|renewal|existing|account review)/i.test(`${summary} ${description}`) ? 'existing' : 'prospect'

const firstSentence = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return ''
  }

  const sentence = normalized.split(/(?<=[.!?])\s/)[0] ?? normalized
  return sentence.trim()
}

const derivePurpose = (summary: string, description: string, companyName: string) =>
  firstSentence(description) ||
  `Prepare for ${summary || 'the upcoming meeting'} with ${companyName}.`

const buildAgendaTags = (summary: string, description: string, type: MeetingType) => {
  const keywords = `${summary} ${description}`.toLowerCase()
  const tags = new Set<string>()

  if (keywords.includes('pricing')) tags.add('Pricing')
  if (keywords.includes('supply')) tags.add('Supply')
  if (keywords.includes('launch')) tags.add('Launch')
  if (keywords.includes('label')) tags.add('Labels')
  if (keywords.includes('packaging')) tags.add('Packaging')
  if (keywords.includes('operations')) tags.add('Operations')

  if (tags.size === 0) {
    const fallback = {
      account_review: ['Account review', 'Commercial planning'],
      operations_alignment: ['Operations', 'Workflow'],
      pricing_supply: ['Pricing', 'Supply assurance'],
      product_expansion: ['Growth', 'Expansion'],
      prospect_discovery: ['Discovery', 'Qualification'],
    } satisfies Record<MeetingType, string[]>

    fallback[type].forEach((tag) => tags.add(tag))
  }

  return [...tags].slice(0, 3)
}

const getEventStart = (event: GoogleCalendarEvent) => event.start?.dateTime ?? null

const getDurationMinutes = (event: GoogleCalendarEvent) => {
  if (!event.start?.dateTime || !event.end?.dateTime) {
    return 30
  }

  const diffMs = new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()
  return Math.max(Math.round(diffMs / 60000), 15)
}

const buildLocation = (event: GoogleCalendarEvent) =>
  event.location ||
  event.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.entryPointType === 'video')?.label ||
  (event.hangoutLink ? 'Google Meet' : 'Google Calendar')

const buildContactName = (attendee: GoogleCalendarAttendee) => {
  if (attendee.displayName?.trim()) {
    return attendee.displayName.trim()
  }

  const emailPrefix = attendee.email?.split('@')[0] ?? 'Attendee'
  return titleCase(emailPrefix.replace(/[._-]+/g, ' '))
}

const isExternalAttendee = (attendee: GoogleCalendarAttendee, currentUserDomain: string | null) => {
  const domain = extractDomain(attendee.email)
  return Boolean(attendee.email && !attendee.self && !attendee.resource && domain && domain !== currentUserDomain)
}

export const loadGoogleCalendarRepository = async (
  accessToken: string,
  authUser: AuthUser,
): Promise<MockDataRepository> => {
  const timeMin = new Date().toISOString()
  const params = new URLSearchParams({
    fields:
      'items(id,summary,description,location,hangoutLink,status,start,end,organizer(email,displayName),attendees(email,displayName,self,resource),conferenceData(entryPoints(entryPointType,label,uri)))',
    maxResults: '25',
    orderBy: 'startTime',
    singleEvents: 'true',
    timeMin,
  })
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Unable to load meetings from Google Calendar.')
  }

  const data = (await response.json()) as GoogleCalendarEventsResponse
  const currentUserDomain = extractDomain(authUser.email)
  const accounts = new Map<string, Account>()
  const contacts = new Map<string, Contact>()

  const meetings = (data.items ?? [])
    .filter((event) => event.status !== 'cancelled' && getEventStart(event))
    .filter((event) => {
      const attendees = event.attendees ?? []
      return attendees.some((attendee) => isExternalAttendee(attendee, currentUserDomain))
    })
    .map((event) => {
      const summary = event.summary?.trim() || 'Calendar meeting'
      const description = event.description?.trim() || ''
      const type = inferMeetingType(summary, description)
      const externalAttendees = (event.attendees ?? []).filter((attendee) =>
        isExternalAttendee(attendee, currentUserDomain),
      )
      const primaryExternalDomain =
        extractDomain(externalAttendees[0]?.email) ??
        extractDomain(event.organizer?.email) ??
        extractDomain(authUser.email) ??
        null
      const companyName = deriveCompanyName(primaryExternalDomain, summary)
      const accountId = `acct-${slugify(primaryExternalDomain ?? companyName ?? event.id)}`

      if (!accounts.has(accountId)) {
        accounts.set(accountId, {
          id: accountId,
          name: companyName,
          status: inferAccountStatus(summary, description),
          industry: 'General business',
          subIndustry: 'Unknown',
          employeeRange: 'Unknown',
          footprint: 'Unknown footprint',
          summary: `Synced from Google Calendar for ${companyName}.`,
          relationshipSummary:
            'Relationship details have not been synced yet. Meeting context is coming from Google Calendar.',
          opportunityPotential: 50000,
          strategicFlags: ['Calendar-only account context'],
          packagingNeeds: DEFAULT_PACKAGING_NEEDS[type],
        })
      }

      const contactIds = externalAttendees.map((attendee, index) => {
        const attendeeEmail = attendee.email!.toLowerCase()
        const contactId = `cont-${slugify(attendeeEmail)}`

        if (!contacts.has(contactId)) {
          contacts.set(contactId, {
            id: contactId,
            accountId,
            name: buildContactName(attendee),
            role: index === 0 ? 'Primary contact' : 'Attendee',
            email: attendeeEmail,
            phone: '',
            priority: index === 0 ? 'primary' : 'secondary',
          })
        }

        return contactId
      })

      return {
        id: `gcal-${event.id}`,
        title: summary,
        startAt: getEventStart(event)!,
        durationMinutes: getDurationMinutes(event),
        type,
        purpose: derivePurpose(summary, description, companyName),
        accountId,
        contactIds,
        ownerName: authUser.name,
        location: buildLocation(event),
        integrationSource: 'Google Calendar',
        agendaTags: buildAgendaTags(summary, description, type),
      } satisfies Meeting
    })
    .sort((left, right) => left.startAt.localeCompare(right.startAt))

  return {
    ...emptyRepository,
    meetings,
    accounts: [...accounts.values()].sort((left, right) => left.name.localeCompare(right.name)),
    contacts: [...contacts.values()].sort((left, right) => left.name.localeCompare(right.name)),
  }
}
