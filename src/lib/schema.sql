-- Initial Database Schema for HYCO Property Management

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'ADMIN', -- 'SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'
  allowed_sections TEXT DEFAULT 'overview,properties,tenants,billing,maintenance',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'Commercial', 'Industrial', 'Residential'
  address VARCHAR(255) NOT NULL,
  total_units INT DEFAULT 0,
  available_units INT DEFAULT 0,
  occupancy_rate NUMERIC(5, 2) DEFAULT 0.0,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  unit_number VARCHAR(50) NOT NULL,
  unit_type VARCHAR(50) NOT NULL,
  area_sqft NUMERIC(8, 2) NOT NULL,
  rent_price NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'OCCUPIED', 'UNDER_OFFER', 'MAINTENANCE'
  floor INT DEFAULT 1,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  qbo_invoice_id VARCHAR(100),
  tenant_name VARCHAR(150) NOT NULL,
  suite_reference VARCHAR(50) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PAID', 'PENDING', 'OVERDUE'
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id SERIAL PRIMARY KEY,
  ticket_code VARCHAR(50) UNIQUE NOT NULL,
  property_name VARCHAR(150) NOT NULL,
  suite_number VARCHAR(50) NOT NULL,
  tenant_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'Plomería', 'Electricidad', 'HVAC / Clima', 'Áreas Comunes'
  priority VARCHAR(50) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  status VARCHAR(50) DEFAULT 'RECEIVED', -- 'RECEIVED', 'IN_REVIEW', 'ASSIGNED', 'RESOLVED'
  assigned_technician VARCHAR(150),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

