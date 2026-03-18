import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import PapersContent from "@/components/student/papers-content"

export default async function PapersPage() {
  // 1. Check Session on Server
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "STUDENT") {
    redirect("/login")
  }

  // 2. Render the Client Component
  return <PapersContent />
}