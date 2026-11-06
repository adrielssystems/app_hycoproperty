-- Clean existing demo data if any
DELETE FROM maintenance_tickets;
DELETE FROM invoices;
DELETE FROM units;
DELETE FROM properties;

-- Note: User accounts and passwords are created via secure environment variables
-- in src/lib/seed.ts and hashed with cryptographic scrypt + salt. Never hardcode passwords in SQL.

-- Seed Real-Estate Properties (Indianapolis Portfolio)
INSERT INTO properties (name, type, address, total_units, available_units, occupancy_rate, image_url)
VALUES 
('HYCO Tower Plaza', 'Commercial', '8200 NW 41st St, Doral, FL 33166', 48, 4, 91.67, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'),
('HYCO Logistics Hub', 'Industrial', '10800 NW 106th St, Medley, FL 33178', 16, 2, 87.50, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'),
('HYCO Residential Enclave', 'Residential', '1520 Ponce de Leon, Coral Gables, FL 33134', 32, 1, 96.88, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'),
('Biscayne Executive Suites', 'Commercial', '250 Biscayne Blvd, Miami, FL 33131', 24, 0, 100.00, 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80');

-- Seed Representative Suites/Units
INSERT INTO units (property_id, unit_number, unit_type, area_sqft, rent_price, status, floor)
VALUES
(1, 'Suite 402', 'Oficina Corporativa', 1850, 4200.00, 'OCCUPIED', 4),
(1, 'Suite 204', 'Espacio Flexible', 950, 2400.00, 'AVAILABLE', 2),
(2, 'Warehouse Bay 105', 'Nave Industrial / Muelle', 5400, 7800.00, 'AVAILABLE', 1),
(3, 'Penthouse 12B', 'Residencial Premium', 2200, 5500.00, 'OCCUPIED', 12),
(4, 'Suite 310', 'Consultorio / Estudio', 820, 2650.00, 'OCCUPIED', 3);

-- Seed Invoices (Synced with QuickBooks Online)
INSERT INTO invoices (invoice_number, qbo_invoice_id, tenant_name, suite_reference, amount, due_date, status, paid_at)
VALUES
('INV-2027-0891', 'QBO-10492', 'Global Logistics Corp', 'Suite 402', 4200.00, CURRENT_DATE - INTERVAL '3 days', 'PAID', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('INV-2027-0892', 'QBO-10493', 'Atlas Trans & Freight', 'Warehouse Bay 105', 7800.00, CURRENT_DATE + INTERVAL '5 days', 'PENDING', NULL),
('INV-2027-0893', 'QBO-10494', 'Dr. Roberto Mendoza', 'Penthouse 12B', 5500.00, CURRENT_DATE - INTERVAL '1 day', 'PAID', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('INV-2027-0894', 'QBO-10495', 'Nexa Creative Lab', 'Suite 310', 2650.00, CURRENT_DATE - INTERVAL '10 days', 'OVERDUE', NULL);

-- Seed Maintenance Tickets (Tenant Portal Helpdesk)
INSERT INTO maintenance_tickets (ticket_code, property_name, suite_number, tenant_name, category, priority, status, assigned_technician, description)
VALUES
('TCK-1042', 'HYCO Tower Plaza', 'Suite 402', 'Global Logistics Corp', 'Plomería', 'HIGH', 'IN_REVIEW', 'Carlos Ramírez (HydraPlumb)', 'Goteo en válvula de paso bajo lavamanos en baño ejecutivo.'),
('TCK-1043', 'HYCO Logistics Hub', 'Warehouse Bay 105', 'Atlas Trans & Freight', 'HVAC / Clima', 'MEDIUM', 'ASSIGNED', 'David Sun (AirCold Tech)', 'Mantenimiento semestral programado del condensador de techo muelle 2.'),
('TCK-1044', 'HYCO Residential Enclave', 'Áreas Comunes', 'Administración', 'Electricidad', 'LOW', 'RECEIVED', NULL, 'Sensor de movimiento luz pasillo ala este requiere calibración.'),
('TCK-1045', 'Biscayne Executive Suites', 'Suite 310', 'Nexa Creative Lab', 'Áreas Comunes', 'LOW', 'RESOLVED', 'Mario Gómez', 'Sustitución de tarjeta magnética de acceso peatonal.');

