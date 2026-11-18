import { NextResponse } from 'next/server';
import { getDvrStatusAndChannels, verifyCctvAccess } from '@/lib/hikvisionUtils';

export async function GET(req: Request) {
  const { authorized } = await verifyCctvAccess();
  if (!authorized) {
    return NextResponse.json({ success: false, message: 'Unauthorized CCTV access' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId') || 'test';

  try {
    const data = await getDvrStatusAndChannels(propertyId);
    if (data.notConfigured) {
      return NextResponse.json(
        { success: false, notConfigured: true, message: 'No DVR configured for this property' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      device: data.device,
      channels: data.channels,
      source: data.source,
    });
  } catch (error: any) {
    console.error('CCTV channels error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to connect to DVR' },
      { status: 502 }
    );
  }
}
