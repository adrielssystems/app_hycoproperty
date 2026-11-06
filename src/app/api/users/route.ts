import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

// Helper to verify admin caller
async function getAuthenticatedCaller() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('hyco_session');
  if (!sessionCookie?.value) return null;
  try {
    const user = JSON.parse(sessionCookie.value);
    return user;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const caller = await getAuthenticatedCaller();
    if (!caller || (caller.role !== 'SUPER_ADMIN' && caller.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Acceso no autorizado' }, { status: 403 });
    }

    let users: any[] = [];
    try {
      users = await query(`
        SELECT id, name, email, role, avatar_url, allowed_sections, created_at 
        FROM users 
        ORDER BY id ASC
      `);
    } catch (dbErr) {
      console.warn('DB query failed in users route, returning fallback admin:', dbErr);
      users = [
        {
          id: 1,
          name: 'Héctor O. - Super Administrador',
          email: 'rhectoroc@gmail.com',
          role: 'SUPER_ADMIN',
          allowed_sections: 'overview,properties,tenants,billing,maintenance,settings',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Adriel H. - Director de Operaciones',
          email: 'admin@hycoproperty.com',
          role: 'ADMIN',
          allowed_sections: 'overview,properties,tenants,billing,maintenance,settings',
          created_at: new Date().toISOString(),
        },
      ];
    }

    const formatted = users.map((u) => ({
      ...u,
      allowed_sections: u.allowed_sections ? u.allowed_sections.split(',') : ['overview', 'properties', 'tenants', 'billing', 'maintenance'],
    }));

    return NextResponse.json({ success: true, users: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const caller = await getAuthenticatedCaller();
    if (!caller || (caller.role !== 'SUPER_ADMIN' && caller.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Acceso no autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role = 'EMPLOYEE', allowed_sections = [] } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Nombre, correo y contraseña son obligatorios' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashedPassword = hashPassword(password);
    const sectionsString = Array.isArray(allowed_sections) ? allowed_sections.join(',') : 'overview,properties';

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, allowed_sections, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, allowed_sections, avatar_url, created_at`,
      [
        name.trim(),
        cleanEmail,
        hashedPassword,
        role,
        sectionsString,
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      ]
    );

    return NextResponse.json({
      success: true,
      user: {
        ...result[0],
        allowed_sections: result[0].allowed_sections ? result[0].allowed_sections.split(',') : [],
      },
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const caller = await getAuthenticatedCaller();
    if (!caller || (caller.role !== 'SUPER_ADMIN' && caller.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Acceso no autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, role, allowed_sections, password } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID de usuario requerido' }, { status: 400 });
    }

    const sectionsString = Array.isArray(allowed_sections) ? allowed_sections.join(',') : allowed_sections;

    if (password && password.trim().length > 0) {
      const hashed = hashPassword(password);
      await query(
        `UPDATE users SET name = $1, role = $2, allowed_sections = $3, password_hash = $4 WHERE id = $5`,
        [name, role, sectionsString, hashed, id]
      );
    } else {
      await query(
        `UPDATE users SET name = $1, role = $2, allowed_sections = $3 WHERE id = $4`,
        [name, role, sectionsString, id]
      );
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const caller = await getAuthenticatedCaller();
    if (!caller || (caller.role !== 'SUPER_ADMIN' && caller.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Acceso no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID de usuario requerido' }, { status: 400 });
    }

    if (Number(id) === caller.id) {
      return NextResponse.json({ success: false, message: 'No puedes eliminar tu propio usuario en sesión activa' }, { status: 400 });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
