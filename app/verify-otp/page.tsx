"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react" // Ensure lucide-react is installed

export default function VerifyOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const from = searchParams.get("from")

  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [sendingOTP, setSendingOTP] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [isActivated, setIsActivated] = useState(false)

  const didSend = useRef(false)

  const sendOTP = async () => {
    if (!email || sendingOTP) return
    setSendingOTP(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/otp/send-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        const data = await response.json()
        setCountdown(60)
        setSuccess(data.emailSent ? "OTP sent to your email!" : "Check email or use demo OTP.")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to send OTP")
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.")
    } finally {
      setSendingOTP(false)
    }
  }

  useEffect(() => {
    if (didSend.current) return
    didSend.current = true

    if (from === "register" && email) {
      const storedPassword = typeof window !== "undefined" ? sessionStorage.getItem("registration_password") : null
      if (storedPassword) setPassword(storedPassword)
     // sendOTP()
    } else if (!email) {
      router.push("/login")
    }
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifying(true);

    try {
      const response = await fetch("/api/otp/verify-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid OTP");
        setVerifying(false);
        return;
      }

      // 1. Visually confirm activation
      setIsActivated(true);
      setSuccess("Success! Your account is now ACTIVE.");

      // 2. Clear state that is no longer needed
      setVerifying(false);

      // 3. Handle Login and Redirect
      // Use a slightly shorter delay (1.5s) for better UX
      setTimeout(async () => {
        if (from === "register" && password) {
          const loginResult = await signIn("credentials", {
            email,
            password,
            redirect: false, // We handle the redirect manually below
          });

          if (loginResult?.error) {
            console.error("Auto-login failed:", loginResult.error);
            router.push("/login?error=auto-login-failed");
            return;
          }

          // Cleanup sensitive data
          sessionStorage.removeItem("registration_password");
          
          // Role-based redirect logic
          const role = data.user?.role;
          let destination = "/student/dashboard"; // Default

          if (role === "ADMIN") destination = "/admin";
          if (role === "TEACHER") destination = "/teacher/dashboard";

          // Use window.location.href for a clean state reset on dashboard entry
          window.location.href = destination;
        } else {
          // If not from registration flow, just go to login
          router.push("/login");
        }
      }, 1500);

    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Verify Your Account</CardTitle>
          <CardDescription>
            Account activation for <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* SUCCESS / ACTIVE STATE UI */}
            {success && (
              <div className={`p-4 rounded-md flex items-center gap-3 border ${
                isActivated ? "bg-green-50 border-green-500 text-green-800" : "bg-blue-50 border-blue-200 text-blue-800"
              }`}>
                {isActivated ? <CheckCircle2 className="h-5 w-5 text-green-600 animate-bounce" /> : null}
                <div className="flex flex-col">
                    <span className="font-bold">{isActivated ? "ACCOUNT ACTIVE" : "Notification"}</span>
                    <span className="text-sm">{success}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20">
                {error}
              </div>
            )}

            {!isActivated && (
              <>
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-semibold">Verification Code</label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="text-center text-xl tracking-widest font-mono"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>

                <Button className="w-full text-lg h-12" disabled={verifying || !email}>
                  {verifying ? "Processing..." : "Activate Account"}
                </Button>
              </>
            )}
          </form>

          {!isActivated && (
             <div className="mt-6 text-center text-sm border-t pt-4">
                {countdown > 0 ? (
                    <p className="text-muted-foreground italic">Request new code in {countdown}s</p>
                ) : (
                    <button onClick={sendOTP} disabled={sendingOTP} className="text-primary font-bold hover:underline">
                        {sendingOTP ? "Sending..." : "Resend Activation Code"}
                    </button>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}