import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      property_id,
      unit_number,
      unit_type = 'Oficina Ejecutiva',
      area_sqft = 500,
      rent_price = 1500,
      floor = 1,
      status = 'AVAILABLE',
      image_url = null,
      video_url = null,
    } = body;

    if (!property_id || !unit_number) {
      return NextResponse.json(
        { success: false, message: 'Property ID and unit number are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO units (property_id, unit_number, unit_type, area_sqft, rent_price, floor, status, image_url, video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [property_id, unit_number, unit_type, area_sqft, rent_price, floor, status, image_url, video_url]
    );

    // Update parent property totals
    await updatePropertyStats(property_id);

    return NextResponse.json({ success: true, unit: result[0] });
  } catch (error: any) {
    console.error('Create unit error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, unit_number, unit_type, area_sqft, rent_price, floor, status, image_url, video_url } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Unit ID is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE units
       SET unit_number = COALESCE($1, unit_number),
           unit_type = COALESCE($2, unit_type),
           area_sqft = COALESCE($3, area_sqft),
           rent_price = COALESCE($4, rent_price),
           floor = COALESCE($5, floor),
           status = COALESCE($6, status),
           image_url = COALESCE($7, image_url),
           video_url = COALESCE($8, video_url)
       WHERE id = $9
       RETURNING *`,
      [unit_number, unit_type, area_sqft, rent_price, floor, status, image_url, video_url, id]
    );

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Unit not found' }, { status: 404 });
    }

    await updatePropertyStats(result[0].property_id);

    return NextResponse.json({ success: true, unit: result[0] });
  } catch (error: any) {
    console.error('Update unit error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Unit ID is required' }, { status: 400 });
    }

    const existing = await query('SELECT property_id FROM units WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: 'Unit not found' }, { status: 404 });
    }

    const propertyId = existing[0].property_id;
    await query('DELETE FROM units WHERE id = $1', [id]);
    await updatePropertyStats(propertyId);

    return NextResponse.json({ success: true, message: 'Unit deleted successfully' });
  } catch (error: any) {
    console.error('Delete unit error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function updatePropertyStats(propertyId: number) {
  try {
    const counts = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available
       FROM units
       WHERE property_id = $1`,
      [propertyId]
    );

    const total = parseInt(counts[0].total, 10) || 0;
    const avail = parseInt(counts[0].available, 10) || 0;
    const occRate = total > 0 ? parseFloat((((total - avail) / total) * 100).toFixed(1)) : 0.0;

    await query(
      `UPDATE properties 
       SET total_units = $1, available_units = $2, occupancy_rate = $3 
       WHERE id = $4`,
      [total, avail, occRate, propertyId]
    );
  } catch (err) {
    console.warn('Failed to update property stats:', err);
  }
}

