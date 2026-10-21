import { describe, expect, it } from 'vitest'
import { DIFFICULTY_RULES } from '../../data/difficultyRules'
import { OPERATION_OPTIONS } from '../../data/practiceOptions'
import { makeQuestion } from '../../test/makeQuestion'
import { repeat } from '../../test/randomSequence'
import type { DifficultyLevel } from '../../types/question'
import { ANSWER_CHOICE_COUNT, createAnswerChoices } from './answerChoices'
import { generateQuestion } from './generateQuestion'

const OPERATIONS = OPERATION_OPTIONS.map((option) => option.value)
const LEVELS = Object.keys(DIFFICULTY_RULES) as DifficultyLevel[]

describe('createAnswerChoices', () => {
  it.each(
    OPERATIONS.flatMap((operation) => LEVELS.map((difficulty) => [operation, difficulty] as const)),
  )('gives four unique choices with the correct answer exactly once for %s at %s', (op, level) => {
    repeat(300, () => {
      const question = generateQuestion(op, level)
      const choices = createAnswerChoices(question)

      expect(choices).toHaveLength(ANSWER_CHOICE_COUNT)
      expect(new Set(choices).size).toBe(ANSWER_CHOICE_COUNT)
      expect(choices.filter((choice) => choice === question.correctAnswer)).toHaveLength(1)
    })
  })

  it('puts the correct answer in every position about equally often', () => {
    const question = makeQuestion(7, 'multiplication', 8)
    const positionCounts = [0, 0, 0, 0]
    const runs = 4000

    repeat(runs, () => {
      positionCounts[createAnswerChoices(question).indexOf(question.correctAnswer)]++
    })

    // Each position should get about 25%. These bounds are loose enough that the test
    // won't fail by chance, but would catch the answer being stuck in one place.
    positionCounts.forEach((count) => {
      expect(count / runs).toBeGreaterThan(0.2)
      expect(count / runs).toBeLessThan(0.3)
    })
  })

  it('does not always put the correct answer first', () => {
    const question = makeQuestion(7, 'multiplication', 8)
    const firstChoices = new Set<number>()

    repeat(50, () => firstChoices.add(createAnswerChoices(question)[0]))

    expect(firstChoices.size).toBeGreaterThan(1)
  })
})
