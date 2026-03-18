import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

// Create transporter based on environment variables
const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT) : 587
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD
  const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@learnsphere.com"

  // If SMTP is not configured, return null (will use console.log fallback)
  if (!smtpHost || !smtpUser || !smtpPassword) {
    return null
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  })
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const transporter = getTransporter()

  if (!transporter) {
    // Fallback: Log email content (for development)
    console.log("=".repeat(50))
    console.log("Email would be sent (SMTP not configured):")
    console.log("To:", to)
    console.log("Subject:", subject)
    console.log("Content:", html)
    console.log("=".repeat(50))
    return true // Return true so flow continues in development
  }

  try {
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@learnsphere.com"

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    })

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

export function generateOTPEmailHTML(code: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">LearnSphere</h1>
          <p style="color: white; margin: 10px 0 0 0;">AI Tutor Hub</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #667eea; margin-top: 0;">Email Verification</h2>
          ${userName ? `<p>Hello ${userName},</p>` : "<p>Hello,</p>"}
          <p>Thank you for registering with LearnSphere! Please use the following verification code to complete your registration:</p>
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 0;">${code}</p>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LearnSphere. All rights reserved.</p>
        </div>
      </body>
    </html>
  `
}

