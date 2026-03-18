import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingFooter } from "@/components/landing/landing-footer"

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If user is logged in, redirect to their dashboard
  if (session) {
    if (session.user?.role === "ADMIN") {
      redirect("/admin")
    } else if (session.user?.role === "TEACHER") {
      redirect("/teacher/dashboard")
    } else {
      redirect("/student/dashboard")
    }
  }

  // Show landing page for non-logged-in users
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingCTA />
      <LandingFooter />
    </div>
  )
}
