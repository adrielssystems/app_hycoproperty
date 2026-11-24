-- Initial Database Schema for HYCO Property Management

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'ADMIN', -- 'SUPER_ADMIN' (Developer), 'ADMIN' (Humberto Yanes), 'PROPERTY_MANAGER', 'FINANCE', 'INTERNAL_MAINTENANCE', 'SUBCONTRACTOR'
  allowed_sections TEXT DEFAULT 'overview,properties,tenants,billing,maintenance',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  legal_name VARCHAR(255),
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
  qbo_sync_token VARCHAR(50),
  qbo_customer_id VARCHAR(100),
  qbo_payment_id VARCHAR(100),
  tenant_name VARCHAR(150) NOT NULL,
  suite_reference VARCHAR(50) NOT NULL,
  base_rent NUMERIC(10, 2) DEFAULT 0,
  cam_amount NUMERIC(10, 2) DEFAULT 0,
  amount NUMERIC(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PAID', 'PENDING', 'OVERDUE', 'VOIDED'
  notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- QuickBooks Online (QBO) Chart of Accounts & CAM Recovery Rules Mapping
CREATE TABLE IF NOT EXISTS qbo_account_mappings (
  id SERIAL PRIMARY KEY,
  qbo_account_id VARCHAR(100),
  qbo_account_name VARCHAR(150) UNIQUE NOT NULL,
  platform_category VARCHAR(100) NOT NULL,
  default_recovery VARCHAR(50) NOT NULL, -- 'Recoverable', 'Lease-Specific', 'Non-Recoverable'
  account_type VARCHAR(50) DEFAULT 'Expense',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Property Level Expenses (Synchronized from QBO Bills, Cards, and General Ledger)
CREATE TABLE IF NOT EXISTS property_expenses (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  account_mapping_id INT REFERENCES qbo_account_mappings(id) ON DELETE SET NULL,
  qbo_expense_id VARCHAR(100),
  vendor_name VARCHAR(150) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  expense_date DATE NOT NULL,
  fiscal_year INT NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'ACH',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lease-Level CAM Overrides (Lease provisions override account-level defaults)
CREATE TABLE IF NOT EXISTS lease_cam_overrides (
  id SERIAL PRIMARY KEY,
  unit_id INT REFERENCES units(id) ON DELETE CASCADE,
  account_mapping_id INT REFERENCES qbo_account_mappings(id) ON DELETE CASCADE,
  override_status VARCHAR(50) NOT NULL, -- 'Included', 'Excluded'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(unit_id, account_mapping_id)
);

-- Settings & Integrations Table (QuickBooks Online OAuth 2.0 & Service Mappings)
CREATE TABLE IF NOT EXISTS settings_integrations (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) UNIQUE NOT NULL DEFAULT 'quickbooks',
  is_connected BOOLEAN DEFAULT FALSE,
  realm_id VARCHAR(100),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  service_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Per-Property Hikvision DVR / NVR Credentials (AES-256-GCM Encrypted, SUPER_ADMIN only)
CREATE TABLE IF NOT EXISTS property_dvr_configs (
  id SERIAL PRIMARY KEY,
  property_id INT UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  host VARCHAR(255) NOT NULL,
  port VARCHAR(10) DEFAULT '80',
  username VARCHAR(100) NOT NULL,
  password_encrypted TEXT NOT NULL,
  device_model VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



