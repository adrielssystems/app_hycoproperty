import { getDbPool } from './db';
import fs from 'fs';
import path from 'path';

export async function initAndSeedDatabase() {
  const pool = getDbPool();
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema
  await pool.query(schemaSql);

  // Check if users exist
  const existingUsers = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(existingUsers.rows[0].count) === 0) {
    // Insert super admin and admin users
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, avatar_url)
       VALUES 
       ($1, $2, $3, $4, $5),
       ($6, $7, $8, $9, $10)`,
      [
        'Héctor O. - Super Administrador',
        'rhectoroc@gmail.com',
        'hKZ5hJ47n6Pf',
        'SUPER_ADMIN',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        'Adriel H. - Director de Operaciones',
        'admin@hycoproperty.com',
        'Hyc@pr0p3rty',
        'ADMIN',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      ]
    );

    // Insert sample properties for Indianapolis Portfolio
    await pool.query(`
      INSERT INTO properties (name, type, address, total_units, available_units, occupancy_rate, image_url)
      VALUES 
      ('7898 Zionsville Rd Commercial Center', 'Commercial', '7898 Zionsville Rd, Indianapolis, IN 46268', 36, 3, 91.67, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'),
      ('Park 100 Industrial Center', 'Industrial', '5420 W 84th St (Park 100), Indianapolis, IN 46268', 24, 2, 91.67, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'),
      ('Morris Street Flex & Service Hub', 'Industrial', '2400 W Morris St, Indianapolis, IN 46221', 16, 2, 87.50, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'),
      ('Meridian North Executive Suites', 'Commercial', '9245 N Meridian St, Indianapolis, IN 46260', 28, 1, 96.43, 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80')
    `);

    // Insert sample units
    await pool.query(`
      INSERT INTO units (property_id, unit_number, unit_type, area_sqft, rent_price, status, floor)
      VALUES
      (1, 'Suite 200', 'Corporate Office', 2400, 3600.00, 'OCCUPIED', 2),
      (1, 'Suite 104', 'Flex Space / Retail', 1250, 2100.00, 'AVAILABLE', 1),
      (2, 'Warehouse Bay 4-A', 'Industrial Warehouse / Dock', 6800, 8500.00, 'OCCUPIED', 1),
      (4, 'Suite 310', 'Medical / Professional Studio', 1100, 2850.00, 'OCCUPIED', 3),
      (3, 'Flex Bay 12-B', 'Drive-In Flex / Warehouse', 3200, 4400.00, 'AVAILABLE', 1)
    `);

    // Insert sample invoices
    await pool.query(`
      INSERT INTO invoices (invoice_number, qbo_invoice_id, tenant_name, suite_reference, amount, due_date, status, paid_at)
      VALUES
      ('INV-2026-0891', 'REC-10492', 'Circle City Tech Labs', 'Suite 200 (Zionsville Rd)', 3600.00, CURRENT_DATE - INTERVAL '3 days', 'PAID', CURRENT_TIMESTAMP - INTERVAL '2 days'),
      ('INV-2026-0892', 'REC-10493', 'Midwest Logistics Partners', 'Warehouse Bay 4-A (Park 100)', 8500.00, CURRENT_DATE + INTERVAL '5 days', 'PENDING', NULL),
      ('INV-2026-0893', 'REC-10494', 'Hoosier Supply Chain Corp', 'Flex Bay 12-B (Morris St)', 4400.00, CURRENT_DATE - INTERVAL '1 day', 'PAID', CURRENT_TIMESTAMP - INTERVAL '1 day'),
      ('INV-2026-0894', 'REC-10495', 'Meridian Wellness Center', 'Suite 310 (Meridian North)', 2850.00, CURRENT_DATE - INTERVAL '10 days', 'OVERDUE', NULL)
    `);

    // Insert sample tickets
    await pool.query(`
      INSERT INTO maintenance_tickets (ticket_code, property_name, suite_number, tenant_name, category, priority, status, assigned_technician, description)
      VALUES
      ('TCK-1042', '7898 Zionsville Rd Commercial Center', 'Suite 200', 'Circle City Tech Labs', 'Electrical', 'LOW', 'IN_REVIEW', 'Carlos Ramírez (VoltCare Indy)', 'Conference room LED dimmer panel programming and circuit check.'),
      ('TCK-1043', 'Park 100 Industrial Center', 'Warehouse Bay 4-A', 'Midwest Logistics Partners', 'HVAC / Climate', 'HIGH', 'ASSIGNED', 'David Sun (Indy Air Solutions)', 'Overhead warehouse heating unit filter replacement and airflow calibration.'),
      ('TCK-1044', 'Morris Street Flex & Service Hub', 'Common Loading Bay', 'Building Administration', 'Plumbing', 'MEDIUM', 'RECEIVED', NULL, 'Exterior grease trap inspection and routine backflow certification.'),
      ('TCK-1045', 'Meridian North Executive Suites', 'Suite 310', 'Meridian Wellness Center', 'Access Control', 'LOW', 'RESOLVED', 'Mario Gómez (SafeKey Systems)', 'Keycard sensor battery swap and tenant directory update.')
    `);

    console.log('HYCO Database seeded successfully with Indianapolis portfolio!');
  } else {
    // Check if existing records have legacy addresses and update them
    try {
      const checkLegacy = await pool.query(
        "SELECT id FROM properties WHERE address LIKE '%FL%' OR name LIKE '%Tower Plaza%' LIMIT 1"
      );
      if (checkLegacy.rows.length > 0) {
        await pool.query(`
          UPDATE properties SET 
            name = '7898 Zionsville Rd Commercial Center',
            type = 'Commercial',
            address = '7898 Zionsville Rd, Indianapolis, IN 46268',
            total_units = 36,
            available_units = 3,
            occupancy_rate = 91.67
          WHERE id = 1;

          UPDATE properties SET 
            name = 'Park 100 Industrial Center',
            type = 'Industrial',
            address = '5420 W 84th St (Park 100), Indianapolis, IN 46268',
            total_units = 24,
            available_units = 2,
            occupancy_rate = 91.67
          WHERE id = 2;

          UPDATE properties SET 
            name = 'Morris Street Flex & Service Hub',
            type = 'Industrial',
            address = '2400 W Morris St, Indianapolis, IN 46221',
            total_units = 16,
            available_units = 2,
            occupancy_rate = 87.50
          WHERE id = 3;

          UPDATE properties SET 
            name = 'Meridian North Executive Suites',
            type = 'Commercial',
            address = '9245 N Meridian St, Indianapolis, IN 46260',
            total_units = 28,
            available_units = 1,
            occupancy_rate = 96.43
          WHERE id = 4;

          UPDATE units SET unit_number = 'Suite 200', unit_type = 'Corporate Office', area_sqft = 2400, rent_price = 3600.00 WHERE id = 1;
          UPDATE units SET unit_number = 'Suite 104', unit_type = 'Flex Space / Retail', area_sqft = 1250, rent_price = 2100.00 WHERE id = 2;
          UPDATE units SET unit_number = 'Warehouse Bay 4-A', unit_type = 'Industrial Warehouse / Dock', area_sqft = 6800, rent_price = 8500.00 WHERE id = 3;
          UPDATE units SET unit_number = 'Suite 310', unit_type = 'Medical / Professional Studio', area_sqft = 1100, rent_price = 2850.00 WHERE id = 4;
          UPDATE units SET unit_number = 'Flex Bay 12-B', unit_type = 'Drive-In Flex / Warehouse', area_sqft = 3200, rent_price = 4400.00 WHERE id = 5;

          UPDATE invoices SET tenant_name = 'Circle City Tech Labs', suite_reference = 'Suite 200 (Zionsville Rd)', amount = 3600.00 WHERE id = 1;
          UPDATE invoices SET tenant_name = 'Midwest Logistics Partners', suite_reference = 'Warehouse Bay 4-A (Park 100)', amount = 8500.00 WHERE id = 2;
          UPDATE invoices SET tenant_name = 'Hoosier Supply Chain Corp', suite_reference = 'Flex Bay 12-B (Morris St)', amount = 4400.00 WHERE id = 3;
          UPDATE invoices SET tenant_name = 'Meridian Wellness Center', suite_reference = 'Suite 310 (Meridian North)', amount = 2850.00 WHERE id = 4;

          UPDATE maintenance_tickets SET property_name = '7898 Zionsville Rd Commercial Center', suite_number = 'Suite 200', tenant_name = 'Circle City Tech Labs', category = 'Electrical', description = 'Conference room LED dimmer panel programming and circuit check.' WHERE id = 1;
          UPDATE maintenance_tickets SET property_name = 'Park 100 Industrial Center', suite_number = 'Warehouse Bay 4-A', tenant_name = 'Midwest Logistics Partners', category = 'HVAC / Climate', description = 'Overhead warehouse heating unit filter replacement and airflow calibration.' WHERE id = 2;
          UPDATE maintenance_tickets SET property_name = 'Morris Street Flex & Service Hub', suite_number = 'Common Loading Bay', tenant_name = 'Building Administration', category = 'Plumbing', description = 'Exterior grease trap inspection and routine backflow certification.' WHERE id = 3;
          UPDATE maintenance_tickets SET property_name = 'Meridian North Executive Suites', suite_number = 'Suite 310', tenant_name = 'Meridian Wellness Center', category = 'Access Control', description = 'Keycard sensor battery swap and tenant directory update.' WHERE id = 4;
        `);
        console.log('HYCO Database successfully updated to Indianapolis portfolio!');
      }
    } catch (migError) {
      console.warn('Migration warning:', migError);
    }
  }

  // Ensure admin@hycoproperty.com exists with password Hyc@pr0p3rty
  try {
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, avatar_url)
      VALUES (
        'Adriel H. - Director de Operaciones',
        'admin@hycoproperty.com',
        'Hyc@pr0p3rty',
        'ADMIN',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      )
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = 'Hyc@pr0p3rty', name = 'Adriel H. - Director de Operaciones', role = 'ADMIN';
    `);
  } catch (uErr) {
    console.warn('User admin sync warning:', uErr);
  }
}
