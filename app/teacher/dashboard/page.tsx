import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import { TeacherNavigation } from "@/components/teacher/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, FileText, TrendingUp } from "lucide-react"

export default async function TeacherDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "TEACHER") {
    redirect("/login")
  }

  // Get statistics
  const [quizCount, studentCount, noteCount, attemptCount] = await Promise.all([
    prisma.quiz.count({
      where: { teacherId: session.user?.id },
    }),
    prisma.user.count({
      where: { role: "STUDENT", status: "ACTIVE", deletedAt: null },
    }),
    prisma.studentNote.count({
      where: { teacherId: session.user?.id },
    }),
    prisma.quizAttempt.count({
      where: {
        quiz: { teacherId: session.user?.id },
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <TeacherNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {session.user?.name}!</h2>
          <p className="text-muted-foreground">Manage your quizzes, students, and teaching materials</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total quizzes created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Notes & Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{noteCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Uploaded materials</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quiz Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attemptCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total attempts</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Manage your teaching content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/teacher/quizzes">
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create New Quiz
                </Button>
              </Link>
              <Link href="/teacher/students">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  View Students
                </Button>
              </Link>
              <Link href="/teacher/notes">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Notes/PDFs
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from your classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Recent Quiz Attempts</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {attemptCount > 0 ? `${attemptCount} students have attempted your quizzes` : "No attempts yet"}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Published Quizzes</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {quizCount > 0 ? `You have ${quizCount} quiz${quizCount > 1 ? "zes" : ""} available` : "No quizzes created yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}






