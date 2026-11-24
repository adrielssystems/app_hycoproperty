import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { isEnvironmentConfigured } from '@/lib/quickbooksUtils';

export async function GET() {
  const pool = getDbPool();

  try {
    const res = await pool.query(
      `SELECT is_connected, realm_id, service_config, token_expires_at, updated_at
       FROM settings_integrations
       WHERE provider = 'quickbooks'
       LIMIT 1`
    );

    const row = res.rows[0];

    const qbEnvironment = (process.env.QB_ENVIRONMENT || 'production').toLowerCase().trim();

    return NextResponse.json({
      success: true,
      integration: {
        is_connected: Boolean(row?.is_connected),
        realm_id: row?.realm_id || null,
        service_config: row?.service_config || {},
        is_env_configured: isEnvironmentConfigured(),
        environment: qbEnvironment,
        token_expires_at: row?.token_expires_at || null,
        updated_at: row?.updated_at || null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching settings_integrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch integrations',
        integration: {
          is_connected: false,
          realm_id: null,
          service_config: {},
          is_env_configured: isEnvironmentConfigured(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const pool = getDbPool();

  try {
    const body = await request.json();
    const serviceConfig = body.service_config || {};

    await pool.query(
      `UPDATE settings_integrations
       SET service_config = $1, updated_at = NOW()
       WHERE provider = 'quickbooks'`,
      [JSON.stringify(serviceConfig)]
    );

    return NextResponse.json({
      success: true,
      message: 'Service mappings saved successfully',
      service_config: serviceConfig,
    });
  } catch (error: any) {
    console.error('Error updating service_config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save service mappings' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const pool = getDbPool();

  try {
    await pool.query(
      `UPDATE settings_integrations
       SET is_connected = FALSE,
           access_token = NULL,
           refresh_token = NULL,
           realm_id = NULL,
           token_expires_at = NULL,
           updated_at = NOW()
       WHERE provider = 'quickbooks'`
    );

    return NextResponse.json({
      success: true,
      message: 'QuickBooks disconnected successfully',
    });
  } catch (error: any) {
    console.error('Error disconnecting QuickBooks:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect QuickBooks' },
      { status: 500 }
    );
  }
}
