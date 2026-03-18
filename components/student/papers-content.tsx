"use client" // <--- Crucial: Makes this a Client Component

import { StudentNavigation } from "@/components/student/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const paperPatternData = [
  { year: "2019", math: 15, physics: 12, chemistry: 14, biology: 13 },
  { year: "2020", math: 16, physics: 13, chemistry: 15, biology: 14 },
  { year: "2021", math: 14, physics: 14, chemistry: 16, biology: 15 },
  { year: "2022", math: 17, physics: 15, chemistry: 14, biology: 16 },
  { year: "2023", math: 16, physics: 16, chemistry: 17, biology: 14 },
]

const difficultyTrendData = [
  { year: "2019", easy: 30, medium: 45, hard: 25 },
  { year: "2020", easy: 28, medium: 48, hard: 24 },
  { year: "2021", easy: 32, medium: 42, hard: 26 },
  { year: "2022", easy: 29, medium: 46, hard: 25 },
  { year: "2023", easy: 31, medium: 44, hard: 25 },
]

export default function PapersContent() {
  return (
    <div className="min-h-screen bg-background">
      <StudentNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Past Paper Patterns</h2>
          <p className="text-muted-foreground">Analyze historical exam patterns to prepare better</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Most Frequent Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Physics</div>
              <p className="text-xs text-muted-foreground mt-1">Appears in 85% of papers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">54</div>
              <p className="text-xs text-muted-foreground mt-1">Per exam paper</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Difficulty Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">30-45-25</div>
              <p className="text-xs text-muted-foreground mt-1">Easy-Medium-Hard ratio</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Questions per Subject (5-Year Trend)</CardTitle>
              <CardDescription>Historical question distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paperPatternData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="math" fill="#3b82f6" name="Math" />
                  <Bar dataKey="physics" fill="#10b981" name="Physics" />
                  <Bar dataKey="chemistry" fill="#f59e0b" name="Chemistry" />
                  <Bar dataKey="biology" fill="#ef4444" name="Biology" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Difficulty Distribution Trend</CardTitle>
              <CardDescription>How difficulty levels have changed</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={difficultyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="easy" stroke="#10b981" name="Easy" />
                  <Line type="monotone" dataKey="medium" stroke="#f59e0b" name="Medium" />
                  <Line type="monotone" dataKey="hard" stroke="#ef4444" name="Hard" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>Patterns to help you prepare</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-semibold text-sm text-blue-900">Physics Dominance</p>
                <p className="text-xs text-blue-800 mt-1">
                  Physics questions have consistently appeared most frequently. Allocate more study time to this
                  subject.
                </p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="font-semibold text-sm text-purple-900">Balanced Difficulty</p>
                <p className="text-xs text-purple-800 mt-1">
                  Papers maintain a consistent 30-45-25 ratio of easy-medium-hard questions. Practice all difficulty
                  levels.
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-sm text-green-900">Stable Pattern</p>
                <p className="text-xs text-green-800 mt-1">
                  Question distribution has remained stable over 5 years. Use this data to predict future patterns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}