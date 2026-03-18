import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { answers } = await request.json()

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!quiz || !quiz.isPublished) {
      return NextResponse.json({ error: "Quiz not found or not available" }, { status: 404 })
    }

    
    let score = 0
    let totalScore = 0

    quiz.questions.forEach((question) => {
      totalScore += question.points
      const studentAnswer = answers[question.id]
      if (studentAnswer === question.correctAnswer) {
        score += question.points
      }
    })

  
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: params.id,
        studentId: token.id as string,
        score,
        totalScore,
        answers: answers as any,
      },
    })

    return NextResponse.json(
      {
        attempt,
        score,
        totalScore,
        percentage: Math.round((score / totalScore) * 100),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Submit quiz attempt error:", error)
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 })
  }
}



export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req: request })

    
    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: params.id,
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      
    })

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error("Fetch quiz attempts error:", error)
    
    return NextResponse.json({ 
      error: "Failed to fetch student scores",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}