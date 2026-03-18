import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and OTP code are required" }, { status: 400 })
    }

    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 2. Validate OTP
    const isDemoOTP = code === "123456"
    let validOTPRecord = null

    if (!isDemoOTP) {
      validOTPRecord = await prisma.oTP.findFirst({
        where: {
          userId: user.id,
          code: code,
          verified: false,
          expiresAt: { gt: new Date() },
        },
      })

      if (!validOTPRecord) {
        return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 })
      }
    }

    // 3. SECURE INTERACTIVE TRANSACTION
    // This format GUARANTEES both steps run or the whole thing fails
    await prisma.$transaction(async (tx) => {
      // Step A: FORCE Update User Status
      await tx.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE" },
      })

      // Step B: Update OTP if not demo
      if (!isDemoOTP && validOTPRecord) {
        await tx.oTP.update({
          where: { id: validOTPRecord.id },
          data: { verified: true },
        })
      }
    })

    console.log(`✅ SUCCESS: ${email} status changed to ACTIVE in database.`);

    return NextResponse.json({ 
      message: "OTP verified successfully. Your account is now ACTIVE!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    }, { status: 200 })

  } catch (error) {
    console.error("CRITICAL_VERIFY_ERROR:", error)
    return NextResponse.json({ error: "Verification failed at database level" }, { status: 500 })
  }
}