// components/teacher/student-scores.tsx
"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

interface Attempt {
  id: string
  score: number
  totalScore: number
  createdAt: string;
  completedAt: string
  student: {
    name: string | null
    email: string
  }
}

export function StudentScores({ quizId }: { quizId: string }) {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        // ENSURE PATH IS SINGULAR: /attempt
        const response = await fetch(`/api/teacher/quizzes/${quizId}/attempt`)
        if (response.ok) {
          const data = await response.json()
          setAttempts(data.attempts)
        }
      } catch (error) {
        console.error("Failed to fetch attempts:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAttempts()
  }, [quizId])
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                No attempts recorded for this quiz yet.
              </TableCell>
            </TableRow>
          ) : (
            attempts.map((attempt) => (
              <TableRow key={attempt.id}>
    <TableCell className="font-medium">{attempt.student.name || "N/A"}</TableCell>
    <TableCell>{attempt.student.email}</TableCell>
    <TableCell>{attempt.score} / {attempt.totalScore}</TableCell>
    <TableCell>
      {Math.round((attempt.score / attempt.totalScore) * 100)}%
    </TableCell>
    <TableCell>
      {/* Use createdAt to match the backend sorting */}
      {attempt.createdAt ? new Date(attempt.createdAt).toLocaleDateString() : "N/A"}
    </TableCell>
  </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}