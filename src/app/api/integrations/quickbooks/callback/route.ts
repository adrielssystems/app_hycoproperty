import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { exchangeCodeForTokens, verifyQuickBooksAccess } from '@/lib/quickbooksUtils';

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || 'http';
  const protocol = isLocal ? forwardedProto : 'https';
  return `${protocol}://${host}`;
}

function isStateEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request);

  // Strictly enforce SUPER_ADMIN or ADMIN signed session on callback completion
  const { authenticated, authorized } = await verifyQuickBooksAccess(['SUPER_ADMIN', 'ADMIN']);
  if (!authenticated) {
    return NextResponse.redirect(new URL('/login', origin));
  }
  if (!authorized) {
    return NextResponse.redirect(
      new URL(
        `/?view=settings&tab=integrations&qb_error=${encodeURIComponent(
          'Forbidden: Only administrators can authorize QuickBooks.'
        )}`,
        origin
      )
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('qb_oauth_state')?.value;
  let redirectUri = cookieStore.get('qb_redirect_uri')?.value;

  // Handle user cancellation or Intuit error
  if (error || !code || !realmId) {
    const errorMsg = error || 'Missing authorization code or Realm ID from QuickBooks';
    return NextResponse.redirect(
      new URL(`/?view=settings&tab=integrations&qb_error=${encodeURIComponent(errorMsg)}`, origin)
    );
  }

  // Mandatory constant-time CSRF OAuth state verification
  if (!storedState || !state || !isStateEqual(state, storedState)) {
    return NextResponse.redirect(
      new URL(
        `/?view=settings&tab=integrations&qb_error=${encodeURIComponent(
          'Invalid or expired OAuth CSRF state. Please retry connecting.'
        )}`,
        origin
      )
    );
  }

  // Fallback redirectUri calculation if cookie is missing
  if (!redirectUri) {
    redirectUri = `${origin}/api/integrations/quickbooks/callback`;
  }

  try {
    // Exchange authorization code for production tokens and persist in PostgreSQL
    await exchangeCodeForTokens(code, redirectUri, realmId);

    const response = NextResponse.redirect(
      new URL('/?view=settings&tab=integrations&qb_connected=true', origin)
    );

    // Clean up temporary OAuth cookies
    response.cookies.delete('qb_oauth_state');
    response.cookies.delete('qb_redirect_uri');

    return response;
  } catch (exchangeErr: unknown) {
    const errMsg = exchangeErr instanceof Error ? exchangeErr.message : 'Token exchange failed';
    console.error('QuickBooks OAuth Callback Error:', exchangeErr);
    return NextResponse.redirect(
      new URL(
        `/?view=settings&tab=integrations&qb_error=${encodeURIComponent(errMsg)}`,
        origin
      )
    );
  }
}
