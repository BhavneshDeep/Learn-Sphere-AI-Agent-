import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { generateOTP, getOTPExpiry } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete previous OTPs
    await prisma.oTP.deleteMany({
      where: { userId: token.id as string },
    })

    const code = generateOTP()
    const expiresAt = getOTPExpiry()

    await prisma.oTP.create({
      data: {
        userId: token.id as string,
        code,
        expiresAt,
      },
    })

    // In production, send via email. For now, log it
    console.log(`OTP for ${token.email}: ${code}`)

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("OTP send error:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
