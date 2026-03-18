import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import { TeacherNavigation } from "@/components/teacher/navigation"
import { NotesManagement } from "@/components/teacher/notes-management"

export default async function NotesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "TEACHER") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Notes & Files</h2>
          <p className="text-muted-foreground">Upload and manage notes, PDFs, and files for students</p>
        </div>

        <NotesManagement />
      </div>
    </div>
  )
}






