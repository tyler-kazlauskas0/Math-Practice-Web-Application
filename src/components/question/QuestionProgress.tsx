interface QuestionProgressProps {
  questionNumber: number
  /** `null` for non-stop practice, which has no fixed number of questions. */
  totalQuestions: number | null
}

/** "Question 3 of 10", or just "Question 3" in non-stop practice. */
function QuestionProgress({ questionNumber, totalQuestions }: QuestionProgressProps) {
  return (
    <p className="question-card__progress">
      Question {questionNumber}
      {totalQuestions !== null && ` of ${totalQuestions}`}
    </p>
  )
}

export default QuestionProgress
