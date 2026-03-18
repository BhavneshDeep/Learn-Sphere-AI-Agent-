"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  points: number
}

interface QuizAttemptProps {
  quizId: string
  onBack: () => void
  onComplete: () => void
}

export function QuizAttempt({ quizId, onBack, onComplete }: QuizAttemptProps) {
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`)
      if (response.ok) {
        const data = await response.json()
        setQuiz(data.quiz)
        setQuestions(data.quiz.questions)
      }
    } catch (error) {
      console.error("Failed to fetch quiz:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (!showResult) {
      setAnswers({ ...answers, [questionId]: answer })
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowResult(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowResult(false)
    }
  }

  // UPDATED: This function handles the actual API call
  const handleSubmitQuiz = async () => {
    setIsConfirmOpen(false)
    setSubmitting(true)

    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })

      if (response.ok) {
        const data = await response.json()
        setScore(data.score)
        setCompleted(true)
        setShowResult(true)
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (completed) {
    const totalScore = questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = Math.round((score / totalScore) * 100)

    return (
      <div className="space-y-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Quiz Completed!</CardTitle>
            <CardDescription className="text-green-800">
              Your score: {score} / {totalScore} ({percentage}%)
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {questions.map((q, index) => {
            const userAnswer = answers[q.id]
            const isCorrect = userAnswer === q.correctAnswer
            return (
              <Card key={q.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Question {index + 1} {isCorrect ? "✓" : "✗"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="font-medium">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <div
                        key={option}
                        className={`p-3 rounded-lg border-2 ${
                          option === q.correctAnswer
                            ? "border-green-500 bg-green-50"
                            : option === userAnswer && !isCorrect
                              ? "border-red-500 bg-red-50"
                              : "border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {option === q.correctAnswer && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {option === userAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Explanation:</p>
                      <p className="text-sm">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-2">
          <Button onClick={onComplete} className="flex-1">
            Back to Practice
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const userAnswer = answers[currentQuestion?.id]
  const isAnswered = !!userAnswer
  const allAnswered = questions.every((q) => answers[q.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{quiz?.title}</h3>
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
            <CardDescription>
              Points: {currentQuestion.points} • Topic: {quiz?.topic} • Difficulty: {quiz?.difficulty}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                  disabled={showResult}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    userAnswer === option
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button onClick={handleNext} className="flex-1" disabled={!isAnswered}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={() => setIsConfirmOpen(true)}
                  className="flex-1"
                  disabled={!allAnswered || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Quiz"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* REWRITTEN POPUP DIALOG */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit your quiz. You cannot change your answers after this point.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitQuiz}>
              Yes, Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}