"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Loader2, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Performance {
  id: string
  subject: string
  score: number
  maxScore: number
  grade: string | null
  notes: string | null
  createdAt: string
}

interface StudentPerformanceFormProps {
  studentId: string
  studentName: string
  performances: Performance[]
  onSuccess: () => void
}

export function StudentPerformanceForm({
  studentId,
  studentName,
  performances,
  onSuccess,
}: StudentPerformanceFormProps) {
  const [subject, setSubject] = useState("Math")
  const [score, setScore] = useState("")
  const [maxScore, setMaxScore] = useState("")
  const [grade, setGrade] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!score || !maxScore) {
      alert("Please fill in score and max score")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/teacher/students/${studentId}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          score: Number.parseFloat(score),
          maxScore: Number.parseFloat(maxScore),
          grade: grade || null,
          notes: notes || null,
        }),
      })

      if (response.ok) {
        setScore("")
        setMaxScore("")
        setGrade("")
        setNotes("")
        setIsDialogOpen(false)
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to add performance")
      }
    } catch (error) {
      console.error("Error adding performance:", error)
      alert("Failed to add performance")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (performanceId: string) => {
    if (!confirm("Are you sure you want to delete this performance record?")) return

    try {
      const response = await fetch(`/api/teacher/students/${studentId}/performance/${performanceId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to delete performance:", error)
    }
  }

  const calculatePercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Performance Records</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Performance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Performance Record</DialogTitle>
              <DialogDescription>Record student performance for {studentName}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Math">Math</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Score</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Score</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Grade (Optional)</label>
                <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="A, B, C, etc." />
              </div>

              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Performance"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {performances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No performance records yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performances.map((perf) => (
                  <TableRow key={perf.id}>
                    <TableCell className="font-medium">{perf.subject}</TableCell>
                    <TableCell>
                      {perf.score} / {perf.maxScore}
                    </TableCell>
                    <TableCell>{calculatePercentage(perf.score, perf.maxScore)}%</TableCell>
                    <TableCell>{perf.grade || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(perf.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(perf.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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






