import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total users (not deleted)
    const totalUsers = await prisma.user.count({
      where: {
        deletedAt: null,
      },
    })

    // Get active students
    const activeStudents = await prisma.user.count({
      where: {
        role: "STUDENT",
        status: "ACTIVE",
        deletedAt: null,
      },
    })

    // Get active teachers
    const activeTeachers = await prisma.user.count({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
        deletedAt: null,
      },
    })

    // Get active admins
    const activeAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
        deletedAt: null,
      },
    })

    // Get inactive users
    const inactiveUsers = await prisma.user.count({
      where: {
        status: { in: ["INACTIVE", "SUSPENDED"] },
        deletedAt: null,
      },
    })

    return NextResponse.json(
      {
        totalUsers,
        activeStudents,
        activeTeachers,
        activeAdmins,
        inactiveUsers,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Get user stats error:", error)
    return NextResponse.json({ error: "Failed to fetch user statistics" }, { status: 500 })
  }
}

