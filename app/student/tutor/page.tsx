import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import { StudentNavigation } from "@/components/student/navigation"
import { ChatInterface } from "@/components/student/chat-interface"
import { TutorCharts } from "@/components/student/tutor-charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatInterfaceNew } from "@/components/student/ChatInterfaceNew"

export default async function TutorPage() {
  
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "STUDENT") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Q&A Tutor</h2>
          <p className="text-muted-foreground">Ask questions and get explanations in your preferred style</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Chat with Tutor</CardTitle>
                <CardDescription>Select an explanation mode and ask your question</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {/* <ChatInterface /> */}
                <ChatInterfaceNew userId={session.user.id} />
              </CardContent>
            </Card>
          </div>

          <TutorCharts />
        </div>
      </div>
    </div>
  )
}
