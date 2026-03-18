import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })

    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "OTP code is required" }, { status: 400 })
    }

    // Demo OTP for development/testing
    const isDemoOTP = code === "123456"
    
    let otp
    if (!isDemoOTP) {
      otp = await prisma.oTP.findFirst({
        where: {
          userId: token.id as string,
          code,
        },
      })

      if (!otp) {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
      }

      if (new Date() > otp.expiresAt) {
        return NextResponse.json({ error: "OTP expired" }, { status: 400 })
      }

      await prisma.oTP.update({
        where: { id: otp.id },
        data: { verified: true },
      })
    } else {
      // For demo OTP, create or update a verified OTP record
      // Check if user already has a verified OTP
      const existingOTP = await prisma.oTP.findFirst({
        where: {
          userId: token.id as string,
          verified: true,
          expiresAt: {
            gt: new Date(),
          },
        },
      })

      if (!existingOTP) {
        // Create a demo OTP record that's already verified
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // Valid for 24 hours
        
        await prisma.oTP.create({
          data: {
            userId: token.id as string,
            code: "123456",
            expiresAt,
            verified: true,
          },
        })
      }
    }

    return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 })
  } catch (error) {
    console.error("OTP verify error:", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
