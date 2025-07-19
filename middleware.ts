import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get the user's token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Protect all routes under /admin
  if (pathname.startsWith("/admin")) {
    // If user is not an admin (or not logged in), redirect/rewrite
    // FIX: Compare token.role to a plain string 'ADMIN' instead of the Prisma enum
    if (token?.role !== 'ADMIN') {
      // Redirect to a 'forbidden' page if not an admin
      return NextResponse.rewrite(new URL("/forbidden", req.url));
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/admin/:path*',
}
