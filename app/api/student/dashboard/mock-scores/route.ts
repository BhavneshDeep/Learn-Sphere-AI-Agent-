import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        studentId: session.user.id,
      },
      include: {
        quiz: {
          select: {
            title: true,
          },
        },
      },
      // FIX: Use 'completedAt' because 'createdAt' does not exist in your QuizAttempt schema
      orderBy: {
        completedAt: 'asc', 
      },
      take: 10,
    })

    const formattedData = attempts.map((attempt) => ({
      // TS might still complain if it thinks quiz is null, so we add a fallback
      name: attempt.quiz ? attempt.quiz.title : "Untitled Quiz", 
      score: attempt.totalScore > 0 
        ? Math.round((attempt.score / attempt.totalScore) * 100) 
        : 0,
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Failed to fetch mock scores:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}