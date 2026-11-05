import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const properties = await query(`
      SELECT id, name, type, address, total_units, available_units, occupancy_rate, image_url, video_url, created_at
      FROM properties
      ORDER BY id ASC
    `);
    return NextResponse.json({ success: true, properties });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, address, total_units = 0, available_units = 0, image_url = null, video_url = null } = body;

    if (!name || !type || !address) {
      return NextResponse.json(
        { success: false, message: 'Name, type and address are required' },
        { status: 400 }
      );
    }

    const total = parseInt(total_units, 10) || 0;
    const avail = parseInt(available_units, 10) || 0;
    const occRate = total > 0 ? parseFloat((((total - avail) / total) * 100).toFixed(1)) : 0.0;

    const result = await query(
      `INSERT INTO properties (name, type, address, total_units, available_units, occupancy_rate, image_url, video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, type, address, total, avail, occRate, image_url, video_url]
    );

    return NextResponse.json({ success: true, property: result[0] });
  } catch (error: any) {
    console.error('Create property error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, type, address, total_units, available_units, image_url, video_url } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Property ID is required' }, { status: 400 });
    }

    const total = parseInt(total_units, 10) || 0;
    const avail = parseInt(available_units, 10) || 0;
    const occRate = total > 0 ? parseFloat((((total - avail) / total) * 100).toFixed(1)) : 0.0;

    const result = await query(
      `UPDATE properties
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           address = COALESCE($3, address),
           total_units = $4,
           available_units = $5,
           occupancy_rate = $6,
           image_url = COALESCE($7, image_url),
           video_url = COALESCE($8, video_url)
       WHERE id = $9
       RETURNING *`,
      [name, type, address, total, avail, occRate, image_url, video_url, id]
    );

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, property: result[0] });
  } catch (error: any) {
    console.error('Update property error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Property ID is required' }, { status: 400 });
    }

    await query('DELETE FROM properties WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Property deleted successfully' });
  } catch (error: any) {
    console.error('Delete property error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

