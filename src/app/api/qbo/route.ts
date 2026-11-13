import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { OFFICIAL_QBO_ACCOUNT_MAPPINGS } from '@/lib/qboData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pool = getDbPool();
    const result = await pool.query(
      'SELECT * FROM qbo_account_mappings ORDER BY platform_category, qbo_account_name ASC'
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: OFFICIAL_QBO_ACCOUNT_MAPPINGS.map((m, i) => ({
          id: i + 1,
          ...m,
          is_active: true,
        })),
        source: 'fallback_catalog',
      });
    }

    return NextResponse.json({
      success: true,
      data: result.rows,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching QBO account mappings:', error);
    return NextResponse.json({
      success: true,
      data: OFFICIAL_QBO_ACCOUNT_MAPPINGS.map((m, i) => ({
        id: i + 1,
        ...m,
        is_active: true,
      })),
      source: 'fallback_resilience',
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, qbo_account_name, platform_category, default_recovery, description } = body;

    const pool = getDbPool();
    if (id) {
      const updateRes = await pool.query(
        `UPDATE qbo_account_mappings 
         SET platform_category = $1, default_recovery = $2, description = COALESCE($3, description), updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 RETURNING *`,
        [platform_category, default_recovery, description, id]
      );
      return NextResponse.json({ success: true, data: updateRes.rows[0] });
    } else if (qbo_account_name) {
      const updateRes = await pool.query(
        `UPDATE qbo_account_mappings 
         SET platform_category = $1, default_recovery = $2, description = COALESCE($3, description), updated_at = CURRENT_TIMESTAMP
         WHERE qbo_account_name = $4 RETURNING *`,
        [platform_category, default_recovery, description, qbo_account_name]
      );
      return NextResponse.json({ success: true, data: updateRes.rows[0] });
    }

    return NextResponse.json({ success: false, error: 'Missing mapping identifier' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating QBO account mapping:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

