import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import { StudentNavigation } from "@/components/student/navigation"
import { StudentSearchFile } from "@/components/student/student-file-search"

export default async function StudentSearchPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "STUDENT") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quick Search</h1>
          <p className="text-muted-foreground">Find study notes and materials uploaded by your teachers.</p>
        </div>

        {/* The Search Bar and Results are handled inside here now */}
        <StudentSearchFile />
      </div>
    </div>
  )
}