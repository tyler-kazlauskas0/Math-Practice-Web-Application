import { OPERATION_OPTIONS } from '../../data/practiceOptions'
import type { MathOperation } from '../../types/question'

/** Builds the text shown to the player, e.g. `formatQuestion(7, 'multiplication', 8)` → `7 × 8`. */
export function formatQuestion(left: number, operation: MathOperation, right: number): string {
  const symbol = OPERATION_OPTIONS.find((option) => option.value === operation)!.symbol
  return `${left} ${symbol} ${right}`
}
