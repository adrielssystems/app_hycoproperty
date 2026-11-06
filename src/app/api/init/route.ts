import { NextResponse } from 'next/server';
import { initAndSeedDatabase } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initAndSeedDatabase();
    return NextResponse.json({ success: true, message: 'Base de datos de HYCO inicializada con éxito.' });
  } catch (error: any) {
    console.error('Error seeding DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

