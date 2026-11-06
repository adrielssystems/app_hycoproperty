import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check session freshness
  let isAuthenticated = false;
  const sessionCookie = request.cookies.get('hyco_session');
  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value);
      if (session && session.expires_at && Date.now() < session.expires_at) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. Server-side redirect for unauthenticated users visiting the protected root '/' (Zero-Flash)
  if (pathname === '/') {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Redirect already authenticated users visiting '/login' straight to dashboard '/'
  if (pathname === '/login') {
    if (isAuthenticated) {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // Only apply rate limiting to /api/* routes
  if (pathname.startsWith('/api')) {
    // Determine client IP for identification
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Stricter limits for authentication routes to prevent brute force
    const isAuthRoute = pathname.startsWith('/api/auth');
    const limit = isAuthRoute ? 10 : 120; // 10 attempts/min for auth, 120/min for general API
    const windowMs = 60 * 1000;

    const rateLimitResult = rateLimit(`${clientIp}:${isAuthRoute ? 'auth' : 'api'}`, {
      limit,
      windowMs,
    });

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Demasiadas solicitudes. Por favor intente de nuevo en un minuto.',
          retryAfter: rateLimitResult.reset - Math.ceil(Date.now() / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
            'Retry-After': String(Math.max(1, rateLimitResult.reset - Math.ceil(Date.now() / 1000))),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.reset));

    // Security Headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  // Security Headers for page routes
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, logos, or public static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

