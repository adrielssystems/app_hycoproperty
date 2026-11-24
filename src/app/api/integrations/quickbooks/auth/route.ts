import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyQuickBooksAccess } from '@/lib/quickbooksUtils';

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || 'http';
  const protocol = isLocal ? forwardedProto : 'https';
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request);
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');

  // 1. Strictly enforce SUPER_ADMIN or ADMIN signed session
  const { authenticated, authorized } = await verifyQuickBooksAccess(['SUPER_ADMIN', 'ADMIN']);

  if (!authenticated) {
    return NextResponse.redirect(new URL('/login', origin));
  }
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Only SUPER_ADMIN or ADMIN can connect QuickBooks.' },
      { status: 403 }
    );
  }

  // 2. Validate environment credentials
  const clientId = process.env.QB_CLIENT_ID?.trim();
  if (!clientId) {
    return NextResponse.redirect(
      new URL('/?view=settings&tab=integrations&error=missing_qb_credentials', origin)
    );
  }

  // 3. Resolve redirectUri behind reverse proxies (Easypanel, Traefik, Cloudflare)
  const redirectUri = `${origin}/api/integrations/quickbooks/callback`;

  // 4. Generate random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // 5. Build Intuit OAuth 2.0 authorization URL
  const scope = 'com.intuit.quickbooks.accounting';
  const intuitAuthUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${encodeURIComponent(
    clientId
  )}&response_type=code&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${encodeURIComponent(state)}`;

  const response = NextResponse.redirect(intuitAuthUrl);

  // Store state and redirectUri in cookie for callback verification
  response.cookies.set('qb_oauth_state', state, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  response.cookies.set('qb_redirect_uri', redirectUri, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
