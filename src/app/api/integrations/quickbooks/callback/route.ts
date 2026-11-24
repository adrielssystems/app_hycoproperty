import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens } from '@/lib/quickbooksUtils';

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

  // Verify CSRF OAuth state parameter
  if (storedState && state !== storedState) {
    return NextResponse.redirect(
      new URL(
        `/?view=settings&tab=integrations&qb_error=${encodeURIComponent(
          'Invalid OAuth state parameter. Please retry connecting.'
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
  } catch (exchangeErr: any) {
    console.error('QuickBooks OAuth Callback Error:', exchangeErr);
    return NextResponse.redirect(
      new URL(
        `/?view=settings&tab=integrations&qb_error=${encodeURIComponent(
          exchangeErr.message || 'Token exchange failed'
        )}`,
        origin
      )
    );
  }
}
