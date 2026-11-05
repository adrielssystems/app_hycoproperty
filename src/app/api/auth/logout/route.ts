import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión finalizada con éxito.',
  });

  response.cookies.delete('hyco_session');
  return response;
}

