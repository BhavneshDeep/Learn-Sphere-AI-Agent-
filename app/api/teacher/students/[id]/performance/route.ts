import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const performances = await prisma.studentPerformance.findMany({
      where: {
        studentId: params.id,
        teacherId: token.id as string,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ performances }, { status: 200 })
  } catch (error) {
    console.error("Get performance error:", error)
    return NextResponse.json({ error: "Failed to fetch performance" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subject, score, maxScore, grade, notes } = await request.json()

    if (!subject || score === undefined || maxScore === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const performance = await prisma.studentPerformance.create({
      data: {
        studentId: params.id,
        teacherId: token.id as string,
        subject,
        score,
        maxScore,
        grade: grade || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ performance }, { status: 201 })
  } catch (error) {
    console.error("Create performance error:", error)
    return NextResponse.json({ error: "Failed to create performance" }, { status: 500 })
  }
}






