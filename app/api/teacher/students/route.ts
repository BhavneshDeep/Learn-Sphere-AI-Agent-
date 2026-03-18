import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ students }, { status: 200 })
  } catch (error) {
    console.error("Get students error:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}






