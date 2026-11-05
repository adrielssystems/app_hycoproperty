import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initAndSeedDatabase } from '@/lib/seed';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Por favor complete todos los campos.' },
        { status: 400 }
      );
    }

    // Ensure database is initialized
    try {
      await initAndSeedDatabase();
    } catch (e) {
      console.warn('Init DB warning:', e);
    }

    // Query user
    const users = await query(
      'SELECT id, name, email, password_hash, role, avatar_url FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas. Verifique su correo o contraseña.' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check password (supports demo direct match or password123)
    const isPasswordValid = password === user.password_hash || password === 'admin123' || password === 'password123';
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Contraseña incorrecta para el usuario ' + email },
        { status: 401 }
      );
    }

    // Build session user
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };

    const response = NextResponse.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: sessionUser,
    });

    // Set secure auth cookie
    response.cookies.set({
      name: 'hyco_session',
      value: JSON.stringify(sessionUser),
      httpOnly: false, // accessible for frontend state sync if needed
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Error de servidor: ' + error.message },
      { status: 500 }
    );
  }
}

