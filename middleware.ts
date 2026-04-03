import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security headers configuration
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;

    // Admin only
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Vendor + Admin
    if (pathname.startsWith("/vendor") && !["VENDOR", "ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Staff + Admin
    if (pathname.startsWith("/staff") && !["STAFF", "ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    const response = NextResponse.next();

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add cache headers based on path
    if (pathname.startsWith('/api')) {
      response.headers.set('Cache-Control', 'no-store, max-age=0');
    } else if (pathname.startsWith('/static')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    }

    return response;
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/staff/:path*",
    "/customer/:path*",
    "/payment/:path*",
  ],
};
