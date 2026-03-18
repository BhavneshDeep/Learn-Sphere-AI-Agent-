"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const performanceData = [
  { name: "Math", correct: 45, total: 60 },
  { name: "Physics", correct: 38, total: 50 },
  { name: "Chemistry", correct: 52, total: 65 },
]

const explanationModeUsage = [
  { name: "Short", value: 45 },
  { name: "Detailed", value: 35 },
  { name: "Hint", value: 20 },
]

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"]

export function TutorCharts() {
  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Practice Generator</CardTitle>
            <CardDescription>Generate practice questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center">Practice generator placeholder</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Explanation Mode Usage</CardTitle>
            <CardDescription>Your preference distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={explanationModeUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {explanationModeUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* <Card className="mt-6">
        <CardHeader>
          <CardTitle>Topic Performance</CardTitle>
          <CardDescription>Your accuracy by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="correct" fill="#10b981" name="Correct" />
              <Bar dataKey="total" fill="#e5e7eb" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}
    </>
  )
}

