"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BookOpen, User } from "lucide-react"
import { QuizAttempt } from "./quiz-attempt"

interface Quiz {
  id: string
  title: string
  description: string | null
  topic: string
  difficulty: string
  teacher: {
    name: string
  }
  _count: {
    questions: number
    attempts: number
  }
}

export function TeacherQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [topic, setTopic] = useState("all")
  const [difficulty, setDifficulty] = useState("all")
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [topic, difficulty])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (topic !== "all") params.append("topic", topic)
      if (difficulty !== "all") params.append("difficulty", difficulty)

      const response = await fetch(`/api/teacher/quizzes/published?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes)
      }
    } catch (error) {
      console.error("Failed to fetch quizzes:", error)
    } finally {
      setLoading(false)
    }
  }

  if (selectedQuiz) {
    return (
      <QuizAttempt
        quizId={selectedQuiz.id}
        onBack={() => setSelectedQuiz(null)}
        onComplete={() => {
          setSelectedQuiz(null)
          fetchQuizzes()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Teacher Quizzes</h3>
          <p className="text-sm text-muted-foreground">Take quizzes created by your teachers</p>
        </div>
        <div className="flex gap-2">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              <SelectItem value="Math">Math</SelectItem>
              <SelectItem value="Physics">Physics</SelectItem>
              <SelectItem value="Chemistry">Chemistry</SelectItem>
              <SelectItem value="Biology">Biology</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-40">
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No quizzes available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {quiz.title}
                </CardTitle>
                <CardDescription>
                  {quiz.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded">{quiz.topic}</span>
                  <span className="px-2 py-1 bg-muted rounded">{quiz.difficulty}</span>
                  <span className="px-2 py-1 bg-muted rounded">
                    {quiz._count.questions} questions
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>By {quiz.teacher.name}</span>
                </div>
                <Button className="w-full" onClick={() => setSelectedQuiz(quiz)}>
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}






