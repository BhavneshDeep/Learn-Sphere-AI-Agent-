import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import { StudentNavigation } from "@/components/student/navigation"
import { DashboardWidgets } from "@/components/student/dashboard-widgets"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Zap } from "lucide-react"

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "STUDENT") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {session.user?.name}!</h2>
          <p className="text-muted-foreground">Here's your learning overview for today</p>
        </div>

        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/student/tutor">
                  <Button className="w-full" variant="default">
                    Ask Q&A Tutor
                  </Button>
                </Link>
                <Link href="/student/practice">
                  <Button className="w-full bg-transparent" variant="outline">
                    Practice Questions
                  </Button>
                </Link>
                <Link href="/student/performance">
                  <Button className="w-full bg-transparent" variant="outline">
                    View Performance
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <DashboardWidgets />
      </div>
    </div>
  )
}
