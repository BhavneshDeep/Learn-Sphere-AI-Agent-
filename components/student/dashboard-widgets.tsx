"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Loader2 } from "lucide-react"

// Keep other static data for now, or replace them similarly later
const courseCoverageData = [
  { name: "Math", value: 75 },
  { name: "Physics", value: 28 },
  { name: "Chemistry", value: 85 },
  { name: "Biology", value: 45 },
]

const topicWeaknessesData = [
  { name: "Calculus", weakness: 35 },
  { name: "Organic Chem", weakness: 42 },
  { name: "Genetics", weakness: 28 },
  { name: "Thermodynamics", weakness: 55 },
]

export function DashboardWidgets() {
  // 1. Add state to hold the real data
  const [mockTestScores, setMockTestScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 2. Fetch data when component mounts
  useEffect(() => {
    async function fetchScores() {
      try {
        const res = await fetch("/api/student/dashboard/mock-scores")
        if (res.ok) {
          const data = await res.json()
          setMockTestScores(data)
        }
      } catch (error) {
        console.error("Failed to load scores", error)
      } finally {
        setLoading(false)
      }
    }

    fetchScores()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* --- Course Coverage Widget (Static) --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Coverage</CardTitle>
          <CardDescription>Progress across subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseCoverageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* --- Mock Test Scores Widget (REAL DATA) --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mock Test Scores</CardTitle>
          <CardDescription>Performance trend (Last 10 Quizzes)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : mockTestScores.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTestScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end" 
                  height={60}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, "Score"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-[300px] flex items-center justify-center text-muted-foreground">
               No quiz attempts found yet.
             </div>
          )}
        </CardContent>
      </Card>

      {/* --- Topic Weaknesses Widget (Static) --- */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg">Topic Weaknesses</CardTitle>
          <CardDescription>Areas needing improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topicWeaknessesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="weakness" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* --- Quick Stats Widget (Static) --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
          <CardDescription>Your learning metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Questions Answered</span>
              <span className="text-2xl font-bold">247</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Accuracy Rate</span>
              <span className="text-2xl font-bold">78%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Study Streak</span>
              <span className="text-2xl font-bold">12 days</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Topics Mastered</span>
              <span className="text-2xl font-bold">8</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}