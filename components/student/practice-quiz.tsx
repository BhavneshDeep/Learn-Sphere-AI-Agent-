"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  topic: string
  difficulty: string
}

export function PracticeQuiz() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [topic, setTopic] = useState("all")
  const [difficulty, setDifficulty] = useState("all")
  const [questionCount, setQuestionCount] = useState("5")

  const handleGenerateQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: Number.parseInt(questionCount),
          topic,
          difficulty,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions)
        setCurrentIndex(0)
        setScore(0)
        setSelectedAnswer(null)
        setShowResult(false)
        setQuizStarted(true)
      }
    } catch (error) {
      console.error("Failed to generate questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (answer: string) => {
    if (!showResult) {
      setSelectedAnswer(answer)
    }
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return

    const currentQuestion = questions[currentIndex]
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1)
    }
    setShowResult(true)
  }

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setQuizStarted(false)
    }
  }

  if (!quizStarted) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Number of Questions</label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="15">15 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Topic</label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Difficulty</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleGenerateQuestions} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Start Practice Quiz
        </Button>
      </div>
    )
  }

  if (questions.length === 0) {
    return <div>No questions available</div>
  }

  const currentQuestion = questions[currentIndex]
  const isAnswered = selectedAnswer !== null
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium">
          Score: {score}/{questions.length}
        </span>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          <CardDescription>
            Topic: {currentQuestion.topic} • Difficulty: {currentQuestion.difficulty}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelectAnswer(option)}
                disabled={showResult}
                className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === option
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : showResult && option === currentQuestion.correctAnswer
                      ? "border-green-500 bg-green-50"
                      : "border-border hover:border-primary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && option === currentQuestion.correctAnswer && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {showResult && selectedAnswer === option && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {showResult && (
            <div
              className={`p-4 rounded-lg ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <p className={`font-semibold mb-2 ${isCorrect ? "text-green-900" : "text-red-900"}`}>
                {isCorrect ? "Correct!" : "Incorrect"}
              </p>
              <p className={`text-sm ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!showResult ? (
              <Button onClick={handleSubmitAnswer} disabled={!isAnswered} className="flex-1">
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} className="flex-1">
                {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
