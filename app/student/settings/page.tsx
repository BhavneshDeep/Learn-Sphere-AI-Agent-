import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-config"
import { StudentNavigation } from "@/components/student/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function StudentSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "STUDENT") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Settings</h2>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Full Name</label>
                <Input defaultValue={session.user?.name || ""} disabled />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Email</label>
                <Input defaultValue={session.user?.email || ""} disabled />
              </div>
              <Button disabled>Update Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Preferences</CardTitle>
              <CardDescription>Customize your learning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Learning preferences placeholder - Coming soon</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Notification settings placeholder - Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
