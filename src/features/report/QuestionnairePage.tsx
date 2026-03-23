import { useState } from 'react'
import {
  dealSizeOptions,
  dealStageOptions,
  relationshipOptions,
  smartQuestionDefinitions,
} from '../../lib/meeting-inputs'
import type { Meeting, RepContextInput, SmartQuestionAnswer } from '../../types/domain'

interface QuestionnairePageProps {
  meeting: Meeting | null
  inputContext: RepContextInput
  onInputContextChange: (value: RepContextInput) => void
  onBack: () => void
  onComplete: () => void
}

type StepId = 'deal-stage' | SmartQuestionAnswer['questionId'] | 'quick-context'

const steps: StepId[] = [
  'deal-stage',
  'customer-cares',
  'meeting-trigger',
  'packaging-knowledge',
  'quick-context',
]

export function QuestionnairePage({
  meeting,
  inputContext,
  onInputContextChange,
  onBack,
  onComplete,
}: QuestionnairePageProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1

  const currentAnswer = smartQuestionDefinitions.find((question) => question.id === currentStep)
    ? inputContext.smartAnswers.find(
        (answer) => answer.questionId === currentStep,
      )
    : undefined

  const updateSmartAnswer = (questionId: SmartQuestionAnswer['questionId'], update: Partial<SmartQuestionAnswer>) =>
    onInputContextChange({
      ...inputContext,
      smartAnswers: inputContext.smartAnswers.map((answer) =>
        answer.questionId === questionId ? { ...answer, ...update } : answer,
      ),
    })

  const renderStep = () => {
    if (currentStep === 'deal-stage') {
      return (
        <div className="questionnaire-step">
          <p className="section-kicker">Question 1 of {steps.length}</p>
          <h2>What stage is this meeting in?</h2>
          <div className="questionnaire-option-list">
            {dealStageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  inputContext.dealStage === option.value
                    ? 'questionnaire-option is-selected'
                    : 'questionnaire-option'
                }
                onClick={() => onInputContextChange({ ...inputContext, dealStage: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (currentStep === 'quick-context') {
      return (
        <div className="questionnaire-step">
          <p className="section-kicker">Question {steps.length} of {steps.length}</p>
          <h2>Optional quick context</h2>
          <p className="questionnaire-copy">
            These are optional but help sharpen forecast and relationship assumptions.
          </p>
          <div className="rep-optional-grid">
            <label className="rep-input">
              <span>Deal size</span>
              <select
                value={inputContext.dealSizeBand}
                onChange={(event) =>
                  onInputContextChange({
                    ...inputContext,
                    dealSizeBand: event.target.value as RepContextInput['dealSizeBand'],
                  })
                }
              >
                {dealSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rep-input">
              <span>Relationship strength</span>
              <select
                value={inputContext.relationshipStrength}
                onChange={(event) =>
                  onInputContextChange({
                    ...inputContext,
                    relationshipStrength: event.target.value as RepContextInput['relationshipStrength'],
                  })
                }
              >
                {relationshipOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )
    }

    const question = smartQuestionDefinitions.find((item) => item.id === currentStep)

    if (!question || !currentAnswer) {
      return null
    }

    return (
      <div className="questionnaire-step">
        <p className="section-kicker">Question {currentStepIndex + 1} of {steps.length}</p>
        <h2>{question.prompt}</h2>
        <div className="questionnaire-option-list">
          {question.options.map((option) => (
            <button
              key={`${question.id}-${option}`}
              type="button"
              className={
                currentAnswer.selectedOption === option
                  ? 'questionnaire-option is-selected'
                  : 'questionnaire-option'
              }
              onClick={() =>
                updateSmartAnswer(question.id, {
                  selectedOption: option,
                  otherText: option === 'Other' ? currentAnswer.otherText : undefined,
                })
              }
            >
              {option}
            </button>
          ))}
        </div>
        {currentAnswer.selectedOption === 'Other' ? (
          <input
            className="rep-other-input"
            placeholder="Please specify"
            type="text"
            value={currentAnswer.otherText ?? ''}
            onChange={(event) =>
              updateSmartAnswer(question.id, {
                otherText: event.target.value,
              })
            }
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="questionnaire-page">
      <header className="questionnaire-page__header">
        <div>
          <p className="section-kicker">Research intake</p>
          <h1>{meeting?.title ?? 'Meeting research intake'}</h1>
          <p className="questionnaire-copy">
            Answer a few quick questions so the deep research report is tailored to this meeting.
          </p>
        </div>
      </header>

      <section className="questionnaire-card">
        <div className="questionnaire-progress">
          <span>Step {currentStepIndex + 1}</span>
          <div className="questionnaire-progress__track">
            <div
              className="questionnaire-progress__fill"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {renderStep()}

        <div className="questionnaire-actions">
          <button className="ghost-button" onClick={currentStepIndex === 0 ? onBack : () => setCurrentStepIndex((step) => step - 1)} type="button">
            {currentStepIndex === 0 ? 'Back to meetings' : 'Previous'}
          </button>
          <button
            className="primary-button"
            onClick={isLastStep ? onComplete : () => setCurrentStepIndex((step) => step + 1)}
            type="button"
          >
            {isLastStep ? 'Generate report' : 'Next'}
          </button>
        </div>
      </section>
    </div>
  )
}
