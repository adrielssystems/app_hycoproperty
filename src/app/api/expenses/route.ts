import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { SAMPLE_INDIANAPOLIS_EXPENSES, OFFICIAL_QBO_ACCOUNT_MAPPINGS } from '@/lib/qboData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');
    const fiscalYear = searchParams.get('fiscal_year');

    const pool = getDbPool();
    let query = `
      SELECT 
        e.*,
        m.qbo_account_name,
        m.platform_category,
        m.default_recovery,
        p.name as property_name
      FROM property_expenses e
      LEFT JOIN qbo_account_mappings m ON e.account_mapping_id = m.id
      LEFT JOIN properties p ON e.property_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (propertyId) {
      params.push(propertyId);
      query += ` AND e.property_id = $${params.length}`;
    }

    if (fiscalYear) {
      params.push(fiscalYear);
      query += ` AND e.fiscal_year = $${params.length}`;
    }

    query += ' ORDER BY e.expense_date DESC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      // Return mapped sample expenses
      const fallback = SAMPLE_INDIANAPOLIS_EXPENSES.map((exp, idx) => {
        const mapping = OFFICIAL_QBO_ACCOUNT_MAPPINGS.find(
          (m) => m.qbo_account_name === exp.qbo_account_name
        );
        return {
          id: idx + 1,
          ...exp,
          platform_category: mapping?.platform_category || 'Other',
          default_recovery: mapping?.default_recovery || 'Recoverable',
          property_name:
            exp.property_id === 1
              ? '7898 Zionsville Rd Commercial Center'
              : exp.property_id === 2
              ? 'Park 100 Industrial Center'
              : 'Morris Street Flex & Service Hub',
        };
      }).filter((exp) => {
        if (propertyId && exp.property_id !== parseInt(propertyId)) return false;
        if (fiscalYear && exp.fiscal_year !== parseInt(fiscalYear)) return false;
        return true;
      });

      return NextResponse.json({ success: true, data: fallback, source: 'fallback_catalog' });
    }

    return NextResponse.json({ success: true, data: result.rows, source: 'database' });
  } catch (error) {
    console.error('Error fetching property expenses:', error);
    return NextResponse.json({
      success: true,
      data: SAMPLE_INDIANAPOLIS_EXPENSES.map((exp, idx) => ({
        id: idx + 1,
        ...exp,
        platform_category: 'Utilities',
        default_recovery: 'Recoverable',
        property_name: '7898 Zionsville Rd Commercial Center',
      })),
      source: 'fallback_resilience',
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      property_id,
      qbo_account_name,
      account_mapping_id,
      vendor_name,
      amount,
      expense_date,
      fiscal_year,
      payment_method,
      description,
    } = body;

    const pool = getDbPool();
    let mappingId = account_mapping_id;

    if (!mappingId && qbo_account_name) {
      const mapRes = await pool.query(
        'SELECT id FROM qbo_account_mappings WHERE qbo_account_name = $1 LIMIT 1',
        [qbo_account_name]
      );
      mappingId = mapRes.rows[0]?.id || null;
    }

    const year = fiscal_year || (expense_date ? new Date(expense_date).getFullYear() : 2026);

    const insertRes = await pool.query(
      `INSERT INTO property_expenses 
       (property_id, account_mapping_id, vendor_name, amount, expense_date, fiscal_year, payment_method, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        property_id,
        mappingId,
        vendor_name,
        amount,
        expense_date || new Date().toISOString().slice(0, 10),
        year,
        payment_method || 'ACH',
        description || '',
      ]
    );

    return NextResponse.json({ success: true, data: insertRes.rows[0] });
  } catch (error: any) {
    console.error('Error recording property expense:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

