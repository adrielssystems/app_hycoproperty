import { NextResponse } from 'next/server';
import { fetchDvrSnapshot, verifyCctvAccess } from '@/lib/hikvisionUtils';

export async function GET(req: Request) {
  const { authorized } = await verifyCctvAccess();
  if (!authorized) {
    return NextResponse.json({ success: false, message: 'Unauthorized CCTV access' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const channel = parseInt(searchParams.get('channel') || '1', 10);
  const hd = searchParams.get('hd') === '1';
  const propertyId = searchParams.get('propertyId') || 'test';

  if (isNaN(channel) || channel < 1 || channel > 32) {
    return NextResponse.json({ success: false, message: 'Invalid channel ID' }, { status: 400 });
  }

  try {
    const snap = await fetchDvrSnapshot(channel, hd, propertyId);
    if (!snap) {
      return NextResponse.json({ success: false, message: 'Failed to retrieve frame from DVR' }, { status: 502 });
    }

    return new Response(snap.buffer, {
      status: 200,
      headers: {
        'Content-Type': snap.contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'DVR connection timeout' },
      { status: 502 }
    );
  }
}
