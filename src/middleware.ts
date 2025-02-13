import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@/types";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ['/welcome', '/auth/signin', '/auth/signup'];
  if (publicPaths.includes(path) || path.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  // Admin only routes
  if (path.startsWith('/admin') && token.role !== Role.ADMIN) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Doctor only routes
  if (path.startsWith('/doctor') && token.role !== Role.DOCTOR) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/doctor/:path*",
    "/tasks/:path*",
    "/stock/:path*",
    "/users/:path*",
    "/info/:path*",
    "/equipment/:path*",
    "/diagnostic/:path*",
    "/spare-parts/:path*",
    "/accessories/:path*",
    "/settings/:path*",
    "/welcome",
  ],
};