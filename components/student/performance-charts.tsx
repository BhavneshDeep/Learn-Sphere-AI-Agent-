"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

const topicPerformanceData = [
  { topic: "Algebra", accuracy: 85, attempts: 24 },
  { topic: "Geometry", accuracy: 72, attempts: 18 },
  { topic: "Calculus", accuracy: 68, attempts: 15 },
  { topic: "Statistics", accuracy: 80, attempts: 20 },
  { topic: "Trigonometry", accuracy: 75, attempts: 16 },
]

const weeklyProgressData = [
  { day: "Mon", correct: 12, total: 15 },
  { day: "Tue", correct: 14, total: 18 },
  { day: "Wed", correct: 10, total: 14 },
  { day: "Thu", correct: 16, total: 20 },
  { day: "Fri", correct: 18, total: 22 },
  { day: "Sat", correct: 15, total: 18 },
  { day: "Sun", correct: 13, total: 16 },
]

const skillRadarData = [
  { skill: "Problem Solving", value: 78 },
  { skill: "Conceptual Understanding", value: 82 },
  { skill: "Speed", value: 65 },
  { skill: "Accuracy", value: 80 },
  { skill: "Consistency", value: 72 },
]

export function PerformanceCharts() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">78.5%</div>
            <p className="text-xs text-muted-foreground mt-1">+2.3% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questions Solved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">487</div>
            <p className="text-xs text-muted-foreground mt-1">+45 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Study Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">18 days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Topics Mastered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 28 topics</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* <Card>
          <CardHeader>
            <CardTitle>Topic Performance</CardTitle>
            <CardDescription>Accuracy by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Daily performance this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="correct" stroke="#10b981" name="Correct" />
                <Line type="monotone" dataKey="total" stroke="#ef4444" name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Assessment</CardTitle>
          <CardDescription>Your competency across different skills</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={skillRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Skill Level" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>Areas to focus on for improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-semibold text-sm text-yellow-900">Focus on Calculus</p>
              <p className="text-xs text-yellow-800 mt-1">
                Your accuracy in Calculus is 68%, the lowest among all topics.
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold text-sm text-blue-900">Improve Speed</p>
              <p className="text-xs text-blue-800 mt-1">Your speed score is 65%. Try practicing with time limits.</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-sm text-green-900">Great Consistency!</p>
              <p className="text-xs text-green-800 mt-1">
                Your consistency score is 72%. Keep maintaining regular practice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

