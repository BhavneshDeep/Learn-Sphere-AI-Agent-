import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import { StudentNavigation } from "@/components/student/navigation"
import { PerformanceCharts } from "@/components/student/performance-charts"

export default async function PerformancePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "STUDENT") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Performance Analytics</h2>
          <p className="text-muted-foreground">Track your learning progress and identify areas for improvement</p>
        </div>

        <PerformanceCharts />
      </div>
    </div>
  )
}
