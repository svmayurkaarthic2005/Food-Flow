import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based redirects after login
    if (path === '/' && token) {
      if (token.role === 'DRIVER') {
        return NextResponse.redirect(new URL('/driver', req.url));
      }
      if (token.role === 'NGO') {
        return NextResponse.redirect(new URL('/ngo', req.url));
      }
      if (token.role === 'DONOR') {
        return NextResponse.redirect(new URL('/donor', req.url));
      }
      if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }

    // Protect driver routes
    if (path.startsWith('/driver')) {
      if (token?.role !== 'DRIVER') {
        return NextResponse.redirect(new URL('/signin', req.url));
      }
    }

    // Protect NGO routes
    if (path.startsWith('/ngo')) {
      if (token?.role !== 'NGO' && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/signin', req.url));
      }
    }

    // Protect donor routes
    if (path.startsWith('/donor')) {
      if (token?.role !== 'DONOR' && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/signin', req.url));
      }
    }

    // Protect admin routes
    if (path.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/signin', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to home page without authentication
        if (req.nextUrl.pathname === '/') {
          return true;
        }
        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/driver/:path*', '/ngo/:path*', '/donor/:path*', '/admin/:path*', '/'],
};
