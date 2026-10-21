import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeConfig, SessionLength } from '../types/session'

interface OperationOption {
  value: MathOperation
  label: string
  symbol: string
}

interface DifficultyOption {
  value: DifficultyLevel
  label: string
  description: string
}

interface SessionLengthOption {
  value: SessionLength
  label: string
  description: string
}

/** Every operation, in the order they are shown. */
export const OPERATION_OPTIONS: OperationOption[] = [
  { value: 'addition', label: 'Addition', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction', symbol: '−' },
  { value: 'multiplication', label: 'Multiplication', symbol: '×' },
  { value: 'division', label: 'Division', symbol: '÷' },
]

/** Difficulty levels from easiest to hardest. Keep descriptions in sync with `DIFFICULTY_RULES`. */
export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Numbers up to 10. Times tables 1 to 5.',
  },
  {
    value: 'easy',
    label: 'Easy',
    description: 'Numbers up to 20. Times tables 1 to 10.',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Numbers up to 100. Times tables 1 to 12.',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Numbers up to 1,000. Times tables up to 12 × 50.',
  },
]

export const SESSION_LENGTH_OPTIONS: SessionLengthOption[] = [
  { value: 5, label: '5 questions', description: 'A quick warm-up' },
  { value: 10, label: '10 questions', description: 'A regular round' },
  { value: 20, label: '20 questions', description: 'A big challenge' },
  { value: 'continuous', label: 'Non-stop', description: 'Keep going until you stop' },
]

/** What the setup page starts with. */
export const DEFAULT_PRACTICE_CONFIG: PracticeConfig = {
  operations: ['addition'],
  difficulty: 'easy',
  sessionLength: 10,
}
