import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyCctvAccess } from '@/lib/hikvisionUtils';

export async function GET() {
  const { authorized } = await verifyCctvAccess();
  if (!authorized) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const rows = await query(
      'SELECT property_id FROM property_dvr_configs WHERE is_active = TRUE'
    );
    return NextResponse.json({
      success: true,
      configuredPropertyIds: rows.map((r: any) => Number(r.property_id)),
    });
  } catch {
    return NextResponse.json({
      success: true,
      configuredPropertyIds: [],
    });
  }
}
