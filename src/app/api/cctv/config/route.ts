import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  verifySuperAdminAccess,
  encryptDvrPassword,
  decryptDvrPassword,
  getDvrStatusAndChannels,
} from '@/lib/hikvisionUtils';

/**
 * GET /api/cctv/config
 * Strictly SUPER_ADMIN only. Returns configured DVR metadata per property (never returns plaintext passwords).
 */
export async function GET() {
  const { authorized } = await verifySuperAdminAccess();
  if (!authorized) {
    return NextResponse.json(
      { success: false, message: 'Forbidden: SUPER_ADMIN access required' },
      { status: 403 }
    );
  }

  try {
    const configs = await query(`
      SELECT id, property_id, host, port, username, device_model, is_active, updated_at
      FROM property_dvr_configs
      ORDER BY property_id ASC
    `);

    return NextResponse.json({
      success: true,
      configs: configs.map((c: any) => ({
        ...c,
        hasPassword: true,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error fetching DVR configs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cctv/config
 * Strictly SUPER_ADMIN only.
 * Supports action: 'test' (tests live ISAPI connection) or 'save' (encrypts password and upserts property_dvr_configs).
 */
export async function POST(req: Request) {
  const { authorized } = await verifySuperAdminAccess();
  if (!authorized) {
    return NextResponse.json(
      { success: false, message: 'Forbidden: SUPER_ADMIN access required' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action = 'save', property_id, host, port = '80', username, password } = body;

    if (!host || !username) {
      return NextResponse.json(
        { success: false, message: 'Host/DDNS and Username are required' },
        { status: 400 }
      );
    }

    // Resolve password: if blank during edit, try reusing existing stored encrypted password
    let effectivePassword = password ? String(password).trim() : '';
    if (!effectivePassword && property_id) {
      const existing = await query(
        'SELECT password_encrypted FROM property_dvr_configs WHERE property_id = $1 LIMIT 1',
        [property_id]
      );
      if (existing.length > 0) {
        effectivePassword = decryptDvrPassword(existing[0].password_encrypted);
      }
    }

    if (!effectivePassword) {
      return NextResponse.json(
        { success: false, message: 'DVR Password is required' },
        { status: 400 }
      );
    }

    // Test connection mode
    if (action === 'test') {
      const status = await getDvrStatusAndChannels(undefined, {
        host: host.trim(),
        port: String(port).trim() || '80',
        user: username.trim(),
        pass: effectivePassword,
      });

      if (!status.device && status.channels.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Connection failed or invalid DVR credentials (no ISAPI response)',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        device: status.device,
        channelCount: status.channels.length,
      });
    }

    // Save mode
    if (!property_id) {
      return NextResponse.json(
        { success: false, message: 'Property ID is required to save DVR configuration' },
        { status: 400 }
      );
    }

    // Attempt to detect model automatically if reachable
    let detectedModel: string | null = null;
    try {
      const status = await getDvrStatusAndChannels(undefined, {
        host: host.trim(),
        port: String(port).trim() || '80',
        user: username.trim(),
        pass: effectivePassword,
      });
      detectedModel = status.device?.model || null;
    } catch {
      // Allow saving even if DVR is temporarily offline
    }

    const encrypted = encryptDvrPassword(effectivePassword);

    const result = await query(
      `INSERT INTO property_dvr_configs (property_id, host, port, username, password_encrypted, device_model, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
       ON CONFLICT (property_id) DO UPDATE SET
         host = EXCLUDED.host,
         port = EXCLUDED.port,
         username = EXCLUDED.username,
         password_encrypted = EXCLUDED.password_encrypted,
         device_model = COALESCE(EXCLUDED.device_model, property_dvr_configs.device_model),
         is_active = TRUE,
         updated_at = NOW()
       RETURNING id, property_id, host, port, username, device_model, is_active, updated_at`,
      [property_id, host.trim(), String(port).trim() || '80', username.trim(), encrypted, detectedModel]
    );

    return NextResponse.json({
      success: true,
      config: { ...result[0], hasPassword: true },
    });
  } catch (error: any) {
    console.error('Save DVR config error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error saving DVR configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cctv/config?propertyId=1
 * Strictly SUPER_ADMIN only.
 */
export async function DELETE(req: Request) {
  const { authorized } = await verifySuperAdminAccess();
  if (!authorized) {
    return NextResponse.json(
      { success: false, message: 'Forbidden: SUPER_ADMIN access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'propertyId is required' }, { status: 400 });
    }

    await query('DELETE FROM property_dvr_configs WHERE property_id = $1', [propertyId]);
    return NextResponse.json({ success: true, message: 'DVR configuration removed' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error deleting DVR configuration' },
      { status: 500 }
    );
  }
}
