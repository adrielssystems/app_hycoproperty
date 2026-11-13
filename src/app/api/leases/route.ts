import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

// Fallback seed overrides reflecting the official PDF sample scenario
const FALLBACK_OVERRIDES = [
  {
    id: 1,
    unit_id: 1,
    unit_number: 'Suite 100',
    account_mapping_id: 19, // Repair & Maintenance:Roofing
    qbo_account_name: 'Repair & Maintenance:Roofing',
    platform_category: 'Roofing',
    default_recovery: 'Lease-Specific',
    override_status: 'Excluded',
    notes: 'Lease Section 8.4: Landlord responsible for all structural roof maintenance',
  },
  {
    id: 2,
    unit_id: 1,
    unit_number: 'Suite 100',
    account_mapping_id: 21, // Legal & Professional Fees
    qbo_account_name: 'Legal & Professional Fees',
    platform_category: 'Professional Fees',
    default_recovery: 'Lease-Specific',
    override_status: 'Excluded',
    notes: 'Lease Section 12.2: Tenant excluded from general landlord legal overhead',
  },
  {
    id: 3,
    unit_id: 3,
    unit_number: 'Suite 200',
    account_mapping_id: 19, // Repair & Maintenance:Roofing
    qbo_account_name: 'Repair & Maintenance:Roofing',
    platform_category: 'Roofing',
    default_recovery: 'Lease-Specific',
    override_status: 'Included',
    notes: 'Full NNN lease contract agreement includes routine roof membrane maintenance',
  },
  {
    id: 4,
    unit_id: 3,
    unit_number: 'Suite 200',
    account_mapping_id: 21, // Legal & Professional Fees
    qbo_account_name: 'Legal & Professional Fees',
    platform_category: 'Professional Fees',
    default_recovery: 'Lease-Specific',
    override_status: 'Included',
    notes: 'Lease Rider B: Tenant shares pro-rata legal fees related to building covenants',
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unit_id');

    const pool = getDbPool();
    let query = `
      SELECT 
        o.id,
        o.unit_id,
        u.unit_number,
        u.tenant_name,
        o.account_mapping_id,
        m.qbo_account_name,
        m.platform_category,
        m.default_recovery,
        o.override_status,
        o.notes,
        o.created_at
      FROM lease_cam_overrides o
      JOIN units u ON o.unit_id = u.id
      JOIN qbo_account_mappings m ON o.account_mapping_id = m.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (unitId) {
      params.push(unitId);
      query += ` AND o.unit_id = $${params.length}`;
    }

    query += ' ORDER BY u.unit_number ASC, m.platform_category ASC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      const filtered = unitId
        ? FALLBACK_OVERRIDES.filter((o) => o.unit_id === parseInt(unitId))
        : FALLBACK_OVERRIDES;
      return NextResponse.json({ success: true, data: filtered, source: 'fallback_scenario' });
    }

    return NextResponse.json({ success: true, data: result.rows, source: 'database' });
  } catch (error) {
    console.error('Error fetching lease CAM overrides:', error);
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unit_id');
    const filtered = unitId
      ? FALLBACK_OVERRIDES.filter((o) => o.unit_id === parseInt(unitId))
      : FALLBACK_OVERRIDES;
    return NextResponse.json({ success: true, data: filtered, source: 'fallback_resilience' });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { unit_id, account_mapping_id, override_status, notes } = body;

    if (!unit_id || !account_mapping_id || !override_status) {
      return NextResponse.json(
        { success: false, error: 'unit_id, account_mapping_id, and override_status are required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const upsertRes = await pool.query(
      `INSERT INTO lease_cam_overrides (unit_id, account_mapping_id, override_status, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (unit_id, account_mapping_id)
       DO UPDATE SET override_status = EXCLUDED.override_status, notes = EXCLUDED.notes
       RETURNING *`,
      [unit_id, account_mapping_id, override_status, notes || null]
    );

    return NextResponse.json({ success: true, data: upsertRes.rows[0] });
  } catch (error: any) {
    console.error('Error upserting lease override:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const unitId = searchParams.get('unit_id');
    const accountMappingId = searchParams.get('account_mapping_id');

    const pool = getDbPool();

    if (id) {
      await pool.query('DELETE FROM lease_cam_overrides WHERE id = $1', [id]);
      return NextResponse.json({ success: true, message: 'Override deleted' });
    }

    if (unitId && accountMappingId) {
      await pool.query(
        'DELETE FROM lease_cam_overrides WHERE unit_id = $1 AND account_mapping_id = $2',
        [unitId, accountMappingId]
      );
      return NextResponse.json({ success: true, message: 'Override deleted' });
    }

    return NextResponse.json(
      { success: false, error: 'Must provide id or (unit_id and account_mapping_id)' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error deleting lease override:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

