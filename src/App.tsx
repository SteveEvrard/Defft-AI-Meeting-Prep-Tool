import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TopBar } from './features/calendar/TopBar'
import { MeetingSidebar } from './features/meetings/MeetingSidebar'
import { CompanySnapshotCard } from './features/report/CompanySnapshotCard'
import { PriorityBrief } from './features/report/PriorityBrief'
import { QuestionnairePage } from './features/report/QuestionnairePage'
import { ReportPage } from './features/report/ReportPage'
import { RightRail } from './features/report/RightRail'
import {
  getGoogleCalendarAccessToken,
  type AuthSession,
  type AuthUser,
} from './lib/auth'
import { emptyRepository, loadGoogleCalendarRepository } from './lib/google-calendar'
import { createDefaultInputContext } from './lib/meeting-inputs'
import { generatePrepReport } from './lib/report-generator'
import type { GeneratedPrepReport, MockDataRepository, RepContextInput } from './types/domain'

type ViewMode = 'dashboard' | 'questionnaire' | 'report'
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

interface AppProps {
  authSession: AuthSession
  authUser: AuthUser
  onSignOut: () => void
}

const filterMeetings = (repository: MockDataRepository, searchTerm: string) => {
  const normalized = searchTerm.trim().toLowerCase()

  return [...repository.meetings]
    .sort((left, right) => left.startAt.localeCompare(right.startAt))
    .filter((meeting) => {
      const account = repository.accounts.find((item) => item.id === meeting.accountId)
      const meetingContacts = repository.contacts.filter((contact) =>
        meeting.contactIds.includes(contact.id),
      )
      const haystack = [
        meeting.title,
        meeting.purpose,
        account?.name,
        account?.industry,
        ...meetingContacts.map((contact) => `${contact.name} ${contact.role}`),
      ]
        .join(' ')
        .toLowerCase()

      return normalized.length === 0 || haystack.includes(normalized)
    })
}

const startOfWeek = (value: Date) => {
  const date = new Date(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day

  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + diff)

  return date
}

const meetingsWithinVisibleWeeks = (meetings: MockDataRepository['meetings'], visibleWeekCount: number) => {
  const currentWeekStart = startOfWeek(new Date())
  const visibleRangeEnd = currentWeekStart.getTime() + visibleWeekCount * WEEK_IN_MS

  return meetings.filter((meeting) => new Date(meeting.startAt).getTime() < visibleRangeEnd)
}

const hasMeetingsBeyondVisibleWeeks = (
  meetings: MockDataRepository['meetings'],
  visibleWeekCount: number,
) => {
  const currentWeekStart = startOfWeek(new Date())
  const visibleRangeEnd = currentWeekStart.getTime() + visibleWeekCount * WEEK_IN_MS

  return meetings.some((meeting) => new Date(meeting.startAt).getTime() >= visibleRangeEnd)
}

const isCompactViewport = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const widths = [
    window.innerWidth,
    document.documentElement.clientWidth,
    window.visualViewport?.width,
    window.screen?.width,
    window.screen?.availWidth,
  ].filter((value): value is number => typeof value === 'number' && value > 0)

  return Math.min(...widths) <= 1120
}

function App({ authSession, authUser, onSignOut }: AppProps) {
  const [repository, setRepository] = useState<MockDataRepository>(emptyRepository)
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true)
  const [meetingsError, setMeetingsError] = useState<string | null>(null)
  const [visibleWeekCount, setVisibleWeekCount] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [report, setReport] = useState<GeneratedPrepReport | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [isMobileLayout, setIsMobileLayout] = useState(() => isCompactViewport())
  const [inputContext, setInputContext] = useState<RepContextInput>(() => createDefaultInputContext())
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const updateLayout = () => {
      setIsMobileLayout(isCompactViewport())
    }

    updateLayout()
    window.addEventListener('resize', updateLayout)
    window.visualViewport?.addEventListener('resize', updateLayout)

    return () => {
      window.removeEventListener('resize', updateLayout)
      window.visualViewport?.removeEventListener('resize', updateLayout)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadMeetings = async () => {
      setIsLoadingMeetings(true)
      setMeetingsError(null)

      try {
        const accessToken = authSession.googleAccessToken ?? getGoogleCalendarAccessToken()

        if (!accessToken) {
          if (!cancelled) {
            setRepository(emptyRepository)
            setSelectedMeetingId(null)
            setReport(null)
            setMeetingsError('Sign in with Google to sync upcoming meetings from Google Calendar.')
          }
          return
        }

        const nextRepository = await loadGoogleCalendarRepository(accessToken, authUser)

        if (cancelled) {
          return
        }

        setRepository(nextRepository)
        setVisibleWeekCount(1)
      } catch (caughtError) {
        if (cancelled) {
          return
        }

        setRepository(emptyRepository)
        setVisibleWeekCount(1)
        setSelectedMeetingId(null)
        setReport(null)
        setMeetingsError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Unable to load upcoming meetings from Google Calendar.',
        )
      } finally {
        if (!cancelled) {
          setIsLoadingMeetings(false)
        }
      }
    }

    void loadMeetings()

    return () => {
      cancelled = true
    }
  }, [authSession.googleAccessToken, authUser])

  const filteredMeetings = useMemo(() => filterMeetings(repository, search), [repository, search])
  const hasSearchTerm = search.trim().length > 0
  const visibleMeetings = useMemo(
    () =>
      hasSearchTerm ? filteredMeetings : meetingsWithinVisibleWeeks(filteredMeetings, visibleWeekCount),
    [filteredMeetings, hasSearchTerm, visibleWeekCount],
  )
  const hasMoreMeetings = useMemo(
    () => (!hasSearchTerm ? hasMeetingsBeyondVisibleWeeks(filteredMeetings, visibleWeekCount) : false),
    [filteredMeetings, hasSearchTerm, visibleWeekCount],
  )

  useEffect(() => {
    if (visibleMeetings.length === 0) {
      setSelectedMeetingId(null)
      setReport(null)
      setViewMode('dashboard')
      return
    }

    if (!selectedMeetingId || !visibleMeetings.some((meeting) => meeting.id === selectedMeetingId)) {
      setSelectedMeetingId(visibleMeetings[0]?.id ?? null)
      setReport(null)
      setViewMode('dashboard')
    }
  }, [selectedMeetingId, visibleMeetings])

  const generate = useCallback((meetingId: string) => {
    setIsGenerating(true)

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setReport(generatePrepReport(meetingId, repository, inputContext))
      setIsGenerating(false)
    }, 800)
  }, [inputContext, repository])

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleSelectMeeting = (meetingId: string) => {
    setSelectedMeetingId(meetingId)
    setReport(null)
    setIsGenerating(false)
    setViewMode('dashboard')
    setInputContext(createDefaultInputContext())

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
  }

  const selectedMeeting =
    selectedMeetingId === null
      ? null
      : repository.meetings.find((meeting) => meeting.id === selectedMeetingId) ?? null
  const selectedAccount =
    selectedMeeting === null
      ? null
      : repository.accounts.find((account) => account.id === selectedMeeting.accountId) ?? null
  const selectedContacts = useMemo(
    () =>
      selectedMeeting === null
        ? []
        : repository.contacts.filter((contact) => selectedMeeting.contactIds.includes(contact.id)),
    [repository.contacts, selectedMeeting],
  )
  const quickBriefReport =
    selectedMeetingId === null ? null : generatePrepReport(selectedMeetingId, repository, inputContext)
  const activeReport =
    selectedMeetingId && report?.meetingId === selectedMeetingId ? report : null
  const showGenerating = selectedMeetingId !== null && isGenerating
  const isFullPageView = viewMode === 'questionnaire' || viewMode === 'report'
  const shellClassName =
    isFullPageView
      ? isMobileLayout
        ? 'app-shell app-shell--report app-shell--mobile'
        : 'app-shell app-shell--report'
      : isMobileLayout
        ? 'app-shell app-shell--mobile'
        : 'app-shell'

  if (viewMode === 'questionnaire') {
    return (
      <div className={shellClassName}>
        <QuestionnairePage
          meeting={selectedMeeting}
          inputContext={inputContext}
          onInputContextChange={setInputContext}
          onBack={() => setViewMode('dashboard')}
          onComplete={() => {
            if (selectedMeeting) {
              setViewMode('report')
              generate(selectedMeeting.id)
            }
          }}
        />
      </div>
    )
  }

  if (viewMode === 'report') {
    return (
      <div className={shellClassName}>
        <ReportPage
          report={activeReport}
          isGenerating={showGenerating}
          onBack={() => setViewMode('dashboard')}
        />
      </div>
    )
  }

  return (
    <div className={shellClassName}>
      <TopBar
        authUser={authUser}
        onSignOut={onSignOut}
        search={search}
        onSearchChange={handleSearchChange}
      />

      <div className={isMobileLayout ? 'workspace workspace--mobile' : 'workspace'}>
        <MeetingSidebar
          meetings={visibleMeetings}
          isLoading={isLoadingMeetings}
          errorMessage={meetingsError}
          hasMoreMeetings={hasMoreMeetings}
          selectedMeetingId={selectedMeetingId}
          accounts={repository.accounts}
          contacts={repository.contacts}
          onLoadMore={() => setVisibleWeekCount((current) => current + 1)}
          onSelectMeeting={handleSelectMeeting}
        />

        {isMobileLayout ? (
          <>
            <RightRail
              meeting={selectedMeeting}
              account={selectedAccount}
              report={activeReport}
              isGenerating={isGenerating}
              onGenerateReport={() => {
                if (selectedMeeting) {
                  setInputContext(createDefaultInputContext())
                  setViewMode('questionnaire')
                }
              }}
            />

            <main className="main-panel">
              {selectedMeeting && selectedAccount ? (
                <>
                  <CompanySnapshotCard
                    meeting={selectedMeeting}
                    account={selectedAccount}
                    contacts={selectedContacts}
                  />
                  {quickBriefReport ? <PriorityBrief report={quickBriefReport} /> : null}
                </>
              ) : (
                <section className="empty-state">
                  <div className="empty-state__orb" />
                  <p className="section-kicker">No meeting selected</p>
                  <h2>Choose an upcoming meeting to generate the prep brief.</h2>
                  <p>
                    Your synced Google Calendar meetings appear here when they are scheduled with
                    external contacts.
                  </p>
                </section>
              )}
            </main>
          </>
        ) : (
          <>
            <main className="main-panel">
              {selectedMeeting && selectedAccount ? (
                <>
                  <CompanySnapshotCard
                    meeting={selectedMeeting}
                    account={selectedAccount}
                    contacts={selectedContacts}
                  />
                  {quickBriefReport ? <PriorityBrief report={quickBriefReport} /> : null}
                </>
              ) : (
                <section className="empty-state">
                  <div className="empty-state__orb" />
                  <p className="section-kicker">No meeting selected</p>
                  <h2>Choose an upcoming meeting to generate the prep brief.</h2>
                  <p>
                    Your synced Google Calendar meetings appear here when they are scheduled with
                    external contacts.
                  </p>
                </section>
              )}
            </main>

            <RightRail
              meeting={selectedMeeting}
              account={selectedAccount}
              report={activeReport}
              isGenerating={isGenerating}
              onGenerateReport={() => {
                if (selectedMeeting) {
                  setInputContext(createDefaultInputContext())
                  setViewMode('questionnaire')
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default App
