"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Eye, Loader2 } from "lucide-react"
import { QuizForm } from "./quiz-form"
import { StudentScores } from "./student-scores"
import { useToast } from "@/components/ui/use-toast" // ✅ Import Toast Hook

interface Quiz {
  id: string
  title: string
  description: string | null
  topic: string
  difficulty: string
  isPublished: boolean
  createdAt: string
  _count: {
    attempts: number
  }
}

export function QuizManagement() {
  const { toast } = useToast() // ✅ Initialize Toast
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/teacher/quizzes")
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

  const handleDelete = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return

    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Quiz Deleted",
          description: "The quiz has been removed successfully.",
          variant: "destructive",
        })
        fetchQuizzes()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the quiz.",
        variant: "destructive",
      })
    }
  }

  const handleTogglePublish = async (quiz: Quiz) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quiz.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quiz,
          isPublished: !quiz.isPublished,
        }),
      })

      if (response.ok) {
        toast({
          title: quiz.isPublished ? "Quiz Unpublished" : "Quiz Published",
          description: `Quiz status updated to ${!quiz.isPublished ? 'Published' : 'Draft'}.`,
        })
        fetchQuizzes()
      }
    } catch (error) {
      console.error("Failed to update quiz:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Your Quizzes</h3>
          <p className="text-sm text-muted-foreground">Manage all your created quizzes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>Add a new quiz with multiple choice questions</DialogDescription>
            </DialogHeader>
            <QuizForm
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                toast({
                  title: "Success",
                  description: "New quiz created successfully.",
                })
                fetchQuizzes()
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No quizzes created yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell>{quiz.topic}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-muted rounded text-xs">{quiz.difficulty}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          quiz.isPublished
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {quiz.isPublished ? "Published" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell>{quiz._count.attempts}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(quiz)}
                        >
                          {quiz.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" title="View Student Scores">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Student Scores: {quiz.title}</DialogTitle>
                              <DialogDescription>
                                List of students who completed this quiz and their results.
                              </DialogDescription>
                            </DialogHeader>
                            <StudentScores quizId={quiz.id} />
                          </DialogContent>
                        </Dialog>

                        <Dialog open={!!editingQuiz && editingQuiz.id === quiz.id} onOpenChange={(open) => !open && setEditingQuiz(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingQuiz(quiz)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Quiz</DialogTitle>
                              <DialogDescription>Update quiz details and questions</DialogDescription>
                            </DialogHeader>
                            {editingQuiz && (
                              <QuizForm
                                quiz={editingQuiz}
                                onSuccess={() => {
                                  setEditingQuiz(null)
                                  toast({
                                    title: "Quiz Updated",
                                    description: "Changes have been saved successfully.",
                                  })
                                  fetchQuizzes()
                                }}
                                onCancel={() => setEditingQuiz(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button variant="outline" size="sm" onClick={() => handleDelete(quiz.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}