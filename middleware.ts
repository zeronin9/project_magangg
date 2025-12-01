import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = ['/login', '/register', '/verify-email'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If accessing public route with token, redirect to dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/mitra', request.url));
  }

  // If accessing protected route without token, redirect to login
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
