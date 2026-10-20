import { useLocation } from 'react-router'
import PageContainer from '../components/layout/PageContainer'
import '../components/practice/practice.css'
import ButtonLink from '../components/ui/ButtonLink'
import {
  DIFFICULTY_OPTIONS,
  OPERATION_OPTIONS,
  SESSION_LENGTH_OPTIONS,
} from '../data/practiceOptions'
import { ROUTES } from '../data/routes'
import { isPracticeConfig } from '../utils/practiceConfig'

function PracticeSessionPage() {
  const { state } = useLocation()

  // The setup page passes the configuration as navigation state. Without it there is
  // nothing to practice, e.g. when this page is opened from a bookmark.
  if (!isPracticeConfig(state)) {
    return (
      <PageContainer title="Practice">
        <p>First, choose what you want to practice.</p>
        <ButtonLink to={ROUTES.practiceSetup}>Set Up Practice</ButtonLink>
      </PageContainer>
    )
  }

  const operations = OPERATION_OPTIONS.filter((option) => state.operations.includes(option.value))
  const difficulty = DIFFICULTY_OPTIONS.find((option) => option.value === state.difficulty)
  const sessionLength = SESSION_LENGTH_OPTIONS.find(
    (option) => option.value === state.sessionLength,
  )

  return (
    <PageContainer title="Practice">
      <p>Questions are coming soon! Here is what you picked:</p>
      <dl className="config-summary">
        <dt>Operations</dt>
        <dd>{operations.map((option) => option.label).join(', ')}</dd>
        <dt>Difficulty</dt>
        <dd>{difficulty?.label}</dd>
        <dt>Questions</dt>
        <dd>{sessionLength?.label}</dd>
      </dl>
      <ButtonLink to={ROUTES.practiceSetup} variant="secondary">
        Change Setup
      </ButtonLink>
    </PageContainer>
  )
}

export default PracticeSessionPage
