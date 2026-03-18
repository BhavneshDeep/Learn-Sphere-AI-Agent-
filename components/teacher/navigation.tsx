"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, FileText, BarChart3, LogOut , Sparkles } from "lucide-react"
import { signOut } from "next-auth/react"
import Image from "next/image"

export function TeacherNavigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/teacher/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/teacher/quizzes", label: "Quizzes", icon: BookOpen },
    { href: "/teacher/students", label: "Students", icon: Users },
    { href: "/teacher/notes", label: "Notes & Files", icon: FileText },
    
  ]

  return (
    <div className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
                {/* Brand Link with Logo */}
            <Link href="/student/dashboard" className="flex items-center">
              <div className="relative">
              <Sparkles className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
              <h1 className="text-xl font-bold">LearnSphere</h1>
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant={isActive ? "default" : "ghost"} className="gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
          <Button
            variant="outline"
            onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}






