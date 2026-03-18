"use client"

import { MessageSquare, BookOpen, TrendingUp, Zap, Users, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: MessageSquare,
    title: "AI-Powered Q&A",
    description: "Ask questions and get instant, accurate answers based on your uploaded study materials. Our AI understands context and provides detailed explanations.",
  },
  {
    icon: BookOpen,
    title: "Smart Note Management",
    description: "Upload notes, PDFs, and files in bulk. Our system automatically organizes and indexes everything for easy access and search.",
  },
  {
    icon: TrendingUp,
    title: "Performance Tracking",
    description: "Monitor your progress with detailed analytics. Track quiz scores, study time, and identify areas that need improvement.",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Get immediate feedback on practice questions and quizzes. Learn from mistakes with detailed explanations.",
  },
  {
    icon: Users,
    title: "Teacher Collaboration",
    description: "Teachers can upload materials, create quizzes, and track student progress. Seamless communication between students and educators.",
  },
  {
    icon: FileText,
    title: "Bulk Upload Support",
    description: "Upload entire folders with ZIP or RAR files. Our system automatically extracts and organizes all your study materials.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Everything You Need to <span className="text-primary">Succeed</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make learning more effective and enjoyable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}





