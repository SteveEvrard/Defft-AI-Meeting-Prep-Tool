import type { DealStage, RepContextInput, SmartQuestionAnswer } from '../types/domain'

export const dealStageOptions: Array<{ value: DealStage; label: string }> = [
  { value: 'first_conversation', label: 'First Conversation' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'solution_discussion', label: 'Solution Discussion' },
  { value: 'technical_validation', label: 'Technical Validation' },
  { value: 'proposal_review', label: 'Proposal Review' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'expansion', label: 'Expansion' },
]

export const smartQuestionDefinitions: Array<{
  id: SmartQuestionAnswer['questionId']
  prompt: string
  options: string[]
}> = [
  {
    id: 'customer-cares',
    prompt: 'What do you believe the customer cares about most?',
    options: [
      'Cost reduction',
      'Packaging performance',
      'Damage reduction',
      'Packing speed',
      'Sustainability',
      'Automation',
      'Not sure yet',
      'Other',
    ],
  },
  {
    id: 'meeting-trigger',
    prompt: 'What triggered this meeting?',
    options: [
      'Customer request',
      'New opportunity',
      'Current supplier issues',
      'Damage complaints',
      'Automation interest',
      'Cost pressure',
      'Internal introduction',
      'Other',
    ],
  },
  {
    id: 'packaging-knowledge',
    prompt: 'What do you already know about their packaging?',
    options: ['Nothing yet', 'Basic understanding', 'Know their packaging well', 'Other'],
  },
]

export const dealSizeOptions: Array<{ value: RepContextInput['dealSizeBand']; label: string }> = [
  { value: 'unknown', label: 'Unknown' },
  { value: '<50k', label: '<50k' },
  { value: '50k-250k', label: '50k-250k' },
  { value: '250k-1m', label: '250k-1m' },
  { value: '>1m', label: '>1m' },
]

export const relationshipOptions: Array<{
  value: RepContextInput['relationshipStrength']
  label: string
}> = [
  { value: 'new', label: 'New' },
  { value: 'early', label: 'Early' },
  { value: 'existing', label: 'Existing' },
  { value: 'strong', label: 'Strong' },
]

export const createDefaultInputContext = (): RepContextInput => ({
  dealStage: 'discovery',
  smartAnswers: smartQuestionDefinitions.map((question) => ({
    questionId: question.id,
    selectedOption: question.options[0],
  })),
  dealSizeBand: 'unknown',
  relationshipStrength: 'new',
})

export const dealStageLabels = Object.fromEntries(
  dealStageOptions.map((option) => [option.value, option.label]),
) as Record<DealStage, string>
