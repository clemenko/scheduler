import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const protectedPaths = ['/my-shifts', '/change-password', '/admin'];
const authPaths = ['/login', '/register'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  let user = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      user = payload.user;
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }

  // Log request to stdout
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const method = request.method;
  const userInfo = user ? `${user.name} (${user.email})` : 'anonymous';
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    method,
    path: pathname,
    user: userInfo,
    ip,
  }));

  // Protect authenticated routes
  if (protectedPaths.some(p => pathname.startsWith(p))) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect authenticated users away from login/register
  if (authPaths.some(p => pathname.startsWith(p))) {
    if (user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
