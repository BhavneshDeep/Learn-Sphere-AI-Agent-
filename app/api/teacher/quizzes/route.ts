import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quizzes = await prisma.quiz.findMany({
      where: { teacherId: token.id as string },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ quizzes }, { status: 200 })
  } catch (error) {
    console.error("Get quizzes error:", error)
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, topic, difficulty, questions, isPublished } = await request.json()

    if (!title || !topic || !difficulty || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || null,
        topic,
        difficulty,
        teacherId: token.id as string,
        isPublished: isPublished || false,
        questions: {
          create: questions.map((q: any, index: number) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            points: q.points || 1,
            order: index,
          })),
        },
      },
      include: {
        questions: true,
      },
    })

    return NextResponse.json({ quiz }, { status: 201 })
  } catch (error) {
    console.error("Create quiz error:", error)
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}






