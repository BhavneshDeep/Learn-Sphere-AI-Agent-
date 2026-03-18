import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import { StudentNavigation } from "@/components/student/navigation"
import { PracticeQuiz } from "@/components/student/practice-quiz"
import { TeacherQuizzes } from "@/components/student/teacher-quizzes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function PracticePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "STUDENT") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Practice Questions</h2>
          <p className="text-muted-foreground">Test your knowledge with quizzes and practice questions</p>
        </div>

        <Tabs defaultValue="teacher-quizzes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="teacher-quizzes">Teacher Quizzes</TabsTrigger>
            <TabsTrigger value="practice-generator">Practice Generator</TabsTrigger>
            <TabsTrigger value="bhavnesh-quizzes">Bhavnesh Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="teacher-quizzes">
            <TeacherQuizzes />
          </TabsContent>

          <TabsContent value="practice-generator">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Generator</CardTitle>
                <CardDescription>Customize and start your practice session</CardDescription>
              </CardHeader>
              <CardContent>
                <PracticeQuiz />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
