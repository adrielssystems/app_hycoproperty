import { NextResponse } from 'next/server';
import { getDvrStatusAndChannels, verifyCctvAccess } from '@/lib/hikvisionUtils';

export async function GET(req: Request) {
  const { authorized } = await verifyCctvAccess();
  if (!authorized) {
    return NextResponse.json({ success: false, message: 'Unauthorized CCTV access' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const propParam = searchParams.get('propertyId');
  const propertyId = propParam ? parseInt(propParam, 10) : undefined;

  try {
    const data = await getDvrStatusAndChannels(propertyId);
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
