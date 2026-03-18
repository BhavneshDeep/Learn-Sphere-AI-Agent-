"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface UserStats {
  totalUsers: number
  activeStudents: number
  activeTeachers: number
  activeAdmins: number
  inactiveUsers: number
}

export function AnalyticsCards() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/users/stats")
      
      if (!response.ok) {
        throw new Error("Failed to fetch statistics")
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()

    // Listen for refresh events from user table actions
    const handleRefresh = () => {
      fetchStats()
    }

    window.addEventListener("refreshAnalytics", handleRefresh)

    return () => {
      window.removeEventListener("refreshAnalytics", handleRefresh)
    }
  }, [fetchStats])

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : error ? (
            <div className="text-sm text-destructive">Error</div>
          ) : (
            <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : error ? (
            <div className="text-sm text-destructive">Error</div>
          ) : (
            <div className="text-2xl font-bold">{stats?.activeStudents ?? 0}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Admins</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : error ? (
            <div className="text-sm text-destructive">Error</div>
          ) : (
            <div className="text-2xl font-bold">{stats?.activeAdmins ?? 0}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : error ? (
            <div className="text-sm text-destructive">Error</div>
          ) : (
            <div className="text-2xl font-bold">{stats?.inactiveUsers ?? 0}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

