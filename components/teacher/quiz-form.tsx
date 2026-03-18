"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Question {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  points: number
}

interface QuizFormProps {
  quiz?: any
  onSuccess: () => void
  onCancel: () => void
}

export function QuizForm({ quiz, onSuccess, onCancel }: QuizFormProps) {
  const [title, setTitle] = useState(quiz?.title || "")
  const [description, setDescription] = useState(quiz?.description || "")
  const [topic, setTopic] = useState(quiz?.topic || "Math")
  const [difficulty, setDifficulty] = useState(quiz?.difficulty || "Easy")
  const [isPublished, setIsPublished] = useState(quiz?.isPublished || false)
  const [questions, setQuestions] = useState<Question[]>(
    quiz?.questions?.map((q: any) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      points: q.points || 1,
    })) || [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
        points: 1,
      },
    ],
  )
  const [loading, setLoading] = useState(false)

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
        points: 1,
      },
    ])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    updated[questionIndex].options[optionIndex] = value
    setQuestions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || questions.length === 0) {
      alert("Please fill in all required fields")
      return
    }

    // Validate questions
    for (const q of questions) {
      if (!q.question || !q.correctAnswer || q.options.some((opt) => !opt)) {
        alert("Please fill in all question fields")
        return
      }
      if (!q.options.includes(q.correctAnswer)) {
        alert("Correct answer must be one of the options")
        return
      }
    }

    setLoading(true)

    try {
      const url = quiz ? `/api/teacher/quizzes/${quiz.id}` : "/api/teacher/quizzes"
      const method = quiz ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          topic,
          difficulty,
          questions,
          isPublished,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to save quiz")
      }
    } catch (error) {
      console.error("Error saving quiz:", error)
      alert("Failed to save quiz")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Quiz Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter quiz title"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter quiz description (optional)"
            rows={3}
          />
        </div>

<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="topic">Topic *</Label>
    <Input
      id="topic"
      placeholder="e.g. Numerical Computing, Data Structures..."
      value={topic}
      onChange={(e) => setTopic(e.target.value)}
      required
      className="w-full"
    />
  </div>

          <div>
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="publish" checked={isPublished} onCheckedChange={setIsPublished} />
          <Label htmlFor="publish">Publish quiz (make it available to students)</Label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Questions *</Label>
          <Button type="button" onClick={addQuestion} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        {questions.map((q, qIndex) => (
          <Card key={qIndex}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Question Text *</Label>
                <Textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                  placeholder="Enter question"
                  required
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Options *</Label>
                {q.options.map((option, optIndex) => (
                  <Input
                    key={optIndex}
                    value={option}
                    onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    required
                  />
                ))}
              </div>

              <div>
                <Label>Correct Answer *</Label>
                <Select
                  value={q.correctAnswer || undefined}
                  onValueChange={(value) => updateQuestion(qIndex, "correctAnswer", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {q.options.map((opt, idx) => {
                      // Only render SelectItem if option has a value (not empty string)
                      if (!opt || opt.trim() === "") {
                        return null
                      }
                      return (
                        <SelectItem key={idx} value={opt}>
                          {opt}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                  placeholder="Explain why this is the correct answer (optional)"
                  rows={2}
                />
              </div>

              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  min="1"
                  value={q.points}
                  onChange={(e) => updateQuestion(qIndex, "points", Number.parseInt(e.target.value) || 1)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            quiz ? "Update Quiz" : "Create Quiz"
          )}
        </Button>
      </div>
    </form>
  )
}

