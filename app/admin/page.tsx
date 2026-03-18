import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import { UserTable } from "@/components/admin/user-table"
import { AnalyticsCards } from "@/components/admin/analytics-cards"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader name={session.user?.name} email={session.user?.email} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnalyticsCards />

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Create, view, update, and delete users</CardDescription>
          </CardHeader>
          <CardContent>
            <UserTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
