import { NextResponse } from 'next/server';
import { getDvrStatusAndChannels, verifyCctvAccess } from '@/lib/hikvisionUtils';

export async function GET() {
  const { authorized } = await verifyCctvAccess();
  if (!authorized) {
    return NextResponse.json({ success: false, message: 'Unauthorized CCTV access' }, { status: 403 });
  }

  try {
    const data = await getDvrStatusAndChannels();
    return NextResponse.json({
      success: true,
      device: data.device,
      channels: data.channels,
    });
  } catch (error: any) {
    console.error('CCTV channels error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to connect to DVR' },
      { status: 502 }
    );
  }
}
