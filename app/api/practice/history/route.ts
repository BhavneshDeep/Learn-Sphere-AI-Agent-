import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const questions = await prisma.practiceQuestion.findMany({
      where: { userId: token.id as string },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json(
      questions.map((q) => ({
        id: q.id,
        question: q.question,
        // Handle both array and JSON string for backwards compatibility
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as any),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        createdAt: q.createdAt,
      })),
    )
  } catch (error) {
    console.error("Get practice history error:", error)
    return NextResponse.json({ error: "Failed to fetch practice history" }, { status: 500 })
  }
}
