import { NextResponse } from 'next/server';
import { keepAliveQuickBooksToken, verifyQuickBooksAccess } from '@/lib/quickbooksUtils';

/**
 * POST /api/integrations/quickbooks/refresh
 * Strictly restricted to authenticated SUPER_ADMIN or ADMIN sessions.
 * Allows on-demand verification of OAuth token rotation and AES-256-GCM encryption upgrade.
 * Routine 24/7 keep-alive runs internally via src/instrumentation.ts (no external cron exposure).
 */
export async function POST() {
  const { authenticated, authorized } = await verifyQuickBooksAccess(['SUPER_ADMIN', 'ADMIN']);

  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  try {
    const result = await keepAliveQuickBooksToken({ force: true });

    if (result.status === 'disconnected') {
      return NextResponse.json(
        { success: false, error: 'QuickBooks Online is not connected.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      realm_id: result.realmId || null,
      token_expires_at: result.tokenExpiresAt || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to renew QuickBooks token';
    console.error('Manual QBO token refresh error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
