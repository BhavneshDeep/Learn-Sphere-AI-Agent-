"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare, BookOpen, TrendingUp, BarChart3, LogOut, User, Search, Brain ,Sparkles } from "lucide-react"
import { signOut } from "next-auth/react"


export function StudentNavigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/student/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/student/tutor", label: "Q&A Tutor", icon: MessageSquare },
    { href: "/student/practice", label: "Practice", icon: BookOpen },
    { href: "/student/performance", label: "Performance", icon: TrendingUp },
    { href: "/student/search", label: "Quick Search", icon: Search },
    { href: "/student/solution", label: "Quick Solve", icon: Brain },
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
            
            {/* Navigation Links */}
            <nav className="hidden md:flex gap-1">
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

          {/* Right Side: Profile & Logout */}
          <div className="flex items-center gap-2">
            
            <Link href="/student/settings">
              <Button variant="ghost" size="icon" className="rounded-full" title="Profile Settings">
                <User className="w-5 h-5" />
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}