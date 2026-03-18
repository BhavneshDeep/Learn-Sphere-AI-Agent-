import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    
    if (token.role === "TEACHER" && quiz.teacherId !== token.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (token.role === "STUDENT" && !quiz.isPublished) {
      return NextResponse.json({ error: "Quiz not available" }, { status: 403 })
    }

    return NextResponse.json({ quiz }, { status: 200 })
  } catch (error) {
    console.error("Get quiz error:", error)
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
    })

    if (!quiz || quiz.teacherId !== token.id) {
      return NextResponse.json({ error: "Quiz not found or unauthorized" }, { status: 404 })
    }

    const { title, description, topic, difficulty, questions, isPublished } = await request.json()

    
    await prisma.quizQuestion.deleteMany({
      where: { quizId: params.id },
    })

    const updatedQuiz = await prisma.quiz.update({
      where: { id: params.id },
      data: {
        title: title || quiz.title,
        description: description !== undefined ? description : quiz.description,
        topic: topic || quiz.topic,
        difficulty: difficulty || quiz.difficulty,
        isPublished: isPublished !== undefined ? isPublished : quiz.isPublished,
        questions: {
          create: questions
            ? questions.map((q: any, index: number) => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || "",
                points: q.points || 1,
                order: index,
              }))
            : [],
        },
      },
      include: {
        questions: true,
      },
    })

    return NextResponse.json({ quiz: updatedQuiz }, { status: 200 })
  } catch (error) {
    console.error("Update quiz error:", error)
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
    })

    if (!quiz || quiz.teacherId !== token.id) {
      return NextResponse.json({ error: "Quiz not found or unauthorized" }, { status: 404 })
    }

    await prisma.quiz.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Quiz deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete quiz error:", error)
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 })
  }
}






