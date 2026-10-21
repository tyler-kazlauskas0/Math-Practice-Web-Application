import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeQuestion } from '../../test/makeQuestion'
import QuestionCard from './QuestionCard'

const question = makeQuestion(7, 'multiplication', 8)

function renderCard(extra?: React.ReactNode) {
  const user = userEvent.setup()
  const onResult = vi.fn()
  render(
    <>
      <QuestionCard
        question={question}
        choices={[54, 56, 63, 48]}
        questionNumber={1}
        totalQuestions={5}
        isLastQuestion={false}
        animate={false}
        onResult={onResult}
        onNext={() => {}}
      />
      {extra}
    </>,
  )
  return { user, onResult }
}

const choice = (value: number) => screen.getByRole('button', { name: `Answer ${value}` })

describe('keyboard', () => {
  it('lets number keys 1–4 choose an answer', async () => {
    const { user } = renderCard()

    await user.keyboard('3')
    expect(choice(63)).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('1')
    expect(choice(54)).toHaveAttribute('aria-pressed', 'true')
    expect(choice(63)).toHaveAttribute('aria-pressed', 'false')
  })

  it('tells assistive technology about the shortcuts', () => {
    renderCard()

    expect(choice(54)).toHaveAttribute('aria-keyshortcuts', '1')
    expect(choice(48)).toHaveAttribute('aria-keyshortcuts', '4')
  })

  it('ignores other keys and keys pressed with Ctrl, Alt, or ⌘', async () => {
    const { user } = renderCard()

    await user.keyboard('5')
    await user.keyboard('{Control>}2{/Control}')
    await user.keyboard('{Meta>}2{/Meta}')

    for (const value of [54, 56, 63, 48]) {
      expect(choice(value)).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('does not take number keys typed into a text box', async () => {
    const { user } = renderCard(<input aria-label="Notes" />)

    await user.click(screen.getByRole('textbox', { name: 'Notes' }))
    await user.keyboard('2')

    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('2')
    expect(choice(56)).toHaveAttribute('aria-pressed', 'false')
  })

  it('stops after the card is flipped', async () => {
    const { user } = renderCard()
    await user.keyboard('2')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))

    await user.keyboard('3')

    expect(screen.getByText('Your answer').nextSibling).toHaveTextContent('56')
  })

  it('works with Tab, Enter, and Space alone', async () => {
    const { user } = renderCard()

    // Tab to the second answer and choose it with Space, then Tab to Flip Card and press Enter.
    await user.tab()
    await user.tab()
    expect(choice(56)).toHaveFocus()
    await user.keyboard(' ')
    for (let i = 0; i < 3; i++) await user.tab()
    expect(screen.getByRole('button', { name: 'Flip Card' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(screen.getByText('Did you get it right?')).toBeInTheDocument()
  })
})

describe('screen readers', () => {
  it('reads the question in words instead of symbols', () => {
    renderCard()

    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName('What is 7 times 8?')
  })

  it('announces the correct answer when the card is flipped', async () => {
    const { user } = renderCard()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()

    await user.click(choice(54))
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))

    expect(screen.getByRole('status')).toHaveTextContent('The correct answer is 56. You chose 54.')
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName('7 times 8 equals 56.')
  })
})

describe('not relying on color alone', () => {
  it('marks the chosen answer and the chosen verdict with a checkmark', async () => {
    const { user } = renderCard()

    await user.click(choice(56))
    expect(choice(56)).toHaveTextContent('✓')

    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(screen.getByRole('button', { name: 'I Got It Right' })).toHaveTextContent('✓')
    expect(screen.getByRole('button', { name: 'I Got It Wrong' })).not.toHaveTextContent('✓')
  })

  it('labels the back of the card in words', async () => {
    const { user } = renderCard()
    await user.click(choice(56))
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))

    expect(screen.getByText('Answer side')).toBeInTheDocument()
  })
})
