import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isSessionValid, refreshSessionExpiration } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('hyco_session');

  if (!sessionCookie?.value) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const session = JSON.parse(sessionCookie.value);

    // Enforce 2-hour inactivity expiration
    if (!isSessionValid(session)) {
      const response = NextResponse.json({
        authenticated: false,
        user: null,
        message: 'Sesión expirada por 2 horas de inactividad.',
      });
      response.cookies.delete('hyco_session');
      return response;
    }

    // Sliding window: refresh expiration on user activity
    const refreshed = refreshSessionExpiration(session);
    const response = NextResponse.json({ authenticated: true, user: refreshed });
    response.cookies.set({
      name: 'hyco_session',
      value: JSON.stringify(refreshed),
      httpOnly: false,
      path: '/',
      maxAge: 7200, // 2 hours
      sameSite: 'lax',
    });

    return response;
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
