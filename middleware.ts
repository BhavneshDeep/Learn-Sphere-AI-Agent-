import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const pathname = request.nextUrl.pathname

  // Public routes
  if (
    pathname === "/login" || 
    pathname === "/forgot-password" || 
    pathname === "/reset-password" || // Allow access to the new password form
    pathname === "/register" || 
    pathname === "/verify-otp" || 
    pathname === "/"
  ) {
    return NextResponse.next()
  }

  // Protected routes - require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // OTP verification is only required during registration flow, not for logged-in users
  // Users logging in are already authenticated and don't need OTP
  // OTP verification happens before login in the registration flow

  // Admin routes - require ADMIN role
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/student/dashboard", request.url))
  }

  // Student routes - require STUDENT role
  if (pathname.startsWith("/student") && token.role !== "STUDENT") {
    if (token.role === "TEACHER") {
      return NextResponse.redirect(new URL("/teacher/dashboard", request.url))
    }
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // Teacher routes - require TEACHER role
  if (pathname.startsWith("/teacher") && token.role !== "TEACHER") {
    if (token.role === "STUDENT") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url))
    }
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
