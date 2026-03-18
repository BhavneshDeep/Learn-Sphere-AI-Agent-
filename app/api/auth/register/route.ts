import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashPassword, generateOTP, getOTPExpiry } from "@/lib/auth"
import { sendEmail, generateOTPEmailHTML } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "STUDENT",
        status: "INACTIVE",
      },
    })

    // Generate and send OTP for email verification after registration
    const code = generateOTP()
    const expiresAt = getOTPExpiry()

    await prisma.oTP.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    })

    // Send OTP via email
    const emailSent = await sendEmail({
      to: email,
      subject: "Verify Your Email - LearnSphere",
      html: generateOTPEmailHTML(code, user.name),
    })

    if (!emailSent) {
      console.error(`Failed to send OTP email to ${email}, but OTP is: ${code}`)
      // Still continue - user can use the OTP from console or demo OTP
    }

    return NextResponse.json({ 
      message: "User registered successfully. Please check your email for the OTP verification code.", 
      userId: user.id,
      email: user.email,
      emailSent: !!emailSent
    }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
