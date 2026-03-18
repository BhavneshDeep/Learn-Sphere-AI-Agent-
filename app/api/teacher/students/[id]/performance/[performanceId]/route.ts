import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; performanceId: string } },
) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const performance = await prisma.studentPerformance.findUnique({
      where: { id: params.performanceId },
    })

    if (!performance || performance.teacherId !== token.id) {
      return NextResponse.json({ error: "Performance not found or unauthorized" }, { status: 404 })
    }

    await prisma.studentPerformance.delete({
      where: { id: params.performanceId },
    })

    return NextResponse.json({ message: "Performance deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete performance error:", error)
    return NextResponse.json({ error: "Failed to delete performance" }, { status: 500 })
  }
}






