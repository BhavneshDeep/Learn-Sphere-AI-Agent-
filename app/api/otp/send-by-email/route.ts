import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateOTP, getOTPExpiry } from "@/lib/auth"
import { sendEmail, generateOTPEmailHTML } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 1. Standard OTP Generation (Keep this for DB integrity)
    const code = generateOTP()
    const expiresAt = getOTPExpiry()
    await prisma.oTP.deleteMany({ where: { userId: user.id } })
    await prisma.oTP.create({
      data: { userId: user.id, code, expiresAt },
    })

    // 2. Send the Email
    const emailSent = await sendEmail({
      to: email,
      subject: "Your Account is Ready - LearnSphere",
      html: generateOTPEmailHTML(code, user.name),
    })

    // 3. Logic Change: If emailSent is true, make the user ACTIVE now
    if (emailSent) {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE" },
      })
      
      return NextResponse.json({ 
        message: "Email sent and account activated.",
        emailSent: true,
        autoActivated: true // Signal for the frontend
      }, { status: 200 })
    }

    return NextResponse.json({ 
      message: "Email failed to send, please verify manually.",
      emailSent: false 
    }, { status: 200 })

  } catch (error) {
    console.error("OTP send error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
  
}