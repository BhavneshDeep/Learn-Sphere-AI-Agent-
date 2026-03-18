import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const topic = searchParams.get("topic") || undefined
    const difficulty = searchParams.get("difficulty") || undefined

    const where: any = {
      isPublished: true,
    }

    if (topic && topic !== "all") {
      where.topic = topic
    }

    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ quizzes }, { status: 200 })
  } catch (error) {
    console.error("Get published quizzes error:", error)
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 })
  }
}






