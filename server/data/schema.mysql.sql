-- ========================================================
-- KirayaSetu Enterprise Database Schema (MySQL 8.0+)
-- Indian Residential Tenancy & Utility Tracking System
-- ========================================================

CREATE DATABASE IF NOT EXISTS kirayasetu_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE kirayasetu_db;

-- 1. USERS TABLE (Landlords & Tenants)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  role ENUM('admin', 'tenant') NOT NULL,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  phone VARCHAR(32) NOT NULL,
  password VARCHAR(255) NOT NULL,
  pan VARCHAR(16) NULL,
  aadhaar VARCHAR(20) NULL,
  address TEXT NULL,
  permanent_address TEXT NULL,
  avatar VARCHAR(512) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(64) PRIMARY KEY,
  landlord_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  property_type VARCHAR(64) DEFAULT 'Multi-family Residential Building',
  address TEXT NOT NULL,
  city VARCHAR(64) DEFAULT 'Bengaluru',
  state VARCHAR(64) DEFAULT 'Karnataka',
  pincode VARCHAR(16) DEFAULT '560034',
  latitude DECIMAL(10, 6) NULL,
  longitude DECIMAL(10, 6) NULL,
  landmarks JSON NULL,
  google_maps_url TEXT NULL,
  directions_url TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. UNITS / FLATS TABLE
CREATE TABLE IF NOT EXISTS units (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL,
  number VARCHAR(32) NOT NULL,
  floor VARCHAR(32) DEFAULT '1st Floor',
  type VARCHAR(32) DEFAULT '2 BHK',
  rent DECIMAL(10, 2) NOT NULL,
  maintenance DECIMAL(10, 2) DEFAULT 0.00,
  deposit DECIMAL(10, 2) NOT NULL,
  status ENUM('vacant', 'occupied') DEFAULT 'vacant',
  tenant_id VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. RENTAL AGREEMENTS (Model Tenancy Act Compliant)
CREATE TABLE IF NOT EXISTS agreements (
  id VARCHAR(64) PRIMARY KEY,
  agreement_number VARCHAR(64) UNIQUE NOT NULL,
  property_id VARCHAR(64) NOT NULL,
  unit_id VARCHAR(64) NOT NULL,
  landlord_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  
  -- Landlord Snapshot
  landlord_name VARCHAR(128) NOT NULL,
  landlord_father_name VARCHAR(128) NULL,
  landlord_aadhaar VARCHAR(20) NULL,
  landlord_pan VARCHAR(16) NULL,
  landlord_phone VARCHAR(32) NULL,
  landlord_address TEXT NULL,

  -- Tenant Snapshot
  tenant_name VARCHAR(128) NOT NULL,
  tenant_father_name VARCHAR(128) NULL,
  tenant_aadhaar VARCHAR(20) NOT NULL,
  tenant_pan VARCHAR(16) NULL,
  tenant_phone VARCHAR(32) NOT NULL,
  tenant_email VARCHAR(128) NULL,
  tenant_permanent_address TEXT NULL,

  -- Commercial Terms
  term_months INT DEFAULT 11,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  security_deposit DECIMAL(10, 2) NOT NULL,
  maintenance_charges DECIMAL(10, 2) DEFAULT 0.00,
  rent_due_date_day INT DEFAULT 5,
  lock_in_period_months INT DEFAULT 3,
  notice_period_months INT DEFAULT 1,
  annual_escalation_percent DECIMAL(5, 2) DEFAULT 5.00,

  -- Dedicated Government Meters
  electricity_meter_no VARCHAR(64) NULL,
  electricity_consumer_id VARCHAR(64) NULL,
  water_meter_no VARCHAR(64) NULL,
  water_consumer_id VARCHAR(64) NULL,

  -- e-Stamp & Witnesses
  stamp_certificate_no VARCHAR(64) NULL,
  stamp_duty_amount DECIMAL(10, 2) DEFAULT 500.00,
  stamp_issue_state VARCHAR(64) DEFAULT 'Government of Karnataka',
  witness1_name VARCHAR(128) NULL,
  witness1_address TEXT NULL,
  witness2_name VARCHAR(128) NULL,
  witness2_address TEXT NULL,

  -- Execution & Digital Signatures
  status ENUM('draft', 'sent_to_tenant', 'executed', 'terminated') DEFAULT 'sent_to_tenant',
  landlord_signed BOOLEAN DEFAULT TRUE,
  landlord_signed_at TIMESTAMP NULL,
  tenant_signed BOOLEAN DEFAULT FALSE,
  tenant_signed_at TIMESTAMP NULL,
  tenant_signature_ref VARCHAR(128) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (landlord_id) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 5. MONTHLY RENT INVOICES & RECEIPTS
CREATE TABLE IF NOT EXISTS rent_invoices (
  id VARCHAR(64) PRIMARY KEY,
  invoice_number VARCHAR(64) UNIQUE NOT NULL,
  property_id VARCHAR(64) NOT NULL,
  unit_id VARCHAR(64) NOT NULL,
  landlord_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  billing_month VARCHAR(32) NOT NULL,
  base_rent DECIMAL(10, 2) NOT NULL,
  maintenance_charges DECIMAL(10, 2) DEFAULT 0.00,
  water_charges DECIMAL(10, 2) DEFAULT 0.00,
  electricity_charges DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('unpaid', 'paid', 'overdue') DEFAULT 'unpaid',
  paid_at TIMESTAMP NULL,
  payment_method VARCHAR(64) NULL,
  transaction_ref VARCHAR(128) NULL,
  receipt_number VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (landlord_id) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 6. GOVERNMENT METERS (BESCOM, BWSSB, BSES, DJB)
CREATE TABLE IF NOT EXISTS government_meters (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL,
  unit_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NULL,
  meter_type ENUM('electricity', 'water') NOT NULL,
  utility_provider VARCHAR(128) NOT NULL,
  consumer_id VARCHAR(64) NOT NULL,
  meter_number VARCHAR(64) NOT NULL,
  sanctioned_load VARCHAR(32) NULL,
  phase_type VARCHAR(64) DEFAULT 'Single Phase Domestic',
  initial_reading DECIMAL(10, 2) DEFAULT 0.00,
  current_reading DECIMAL(10, 2) DEFAULT 0.00,
  status ENUM('active', 'inactive') DEFAULT 'active',
  government_document_ref VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. UTILITY BILLS
CREATE TABLE IF NOT EXISTS utility_bills (
  id VARCHAR(64) PRIMARY KEY,
  meter_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  unit_id VARCHAR(64) NOT NULL,
  billing_month VARCHAR(32) NOT NULL,
  previous_reading DECIMAL(10, 2) NOT NULL,
  current_reading DECIMAL(10, 2) NOT NULL,
  units_consumed DECIMAL(10, 2) NOT NULL,
  rate_per_unit DECIMAL(6, 2) DEFAULT 7.50,
  fixed_charges DECIMAL(10, 2) DEFAULT 120.00,
  amount DECIMAL(10, 2) NOT NULL,
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('unpaid', 'paid', 'overdue') DEFAULT 'unpaid',
  paid_at TIMESTAMP NULL,
  payment_ref VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meter_id) REFERENCES government_meters(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES users(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
) ENGINE=InnoDB;

-- 8. DAMAGE & REPAIR CLAIMS WITH INVOICES
CREATE TABLE IF NOT EXISTS damage_reports (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL,
  unit_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) DEFAULT 'Plumbing',
  severity ENUM('Low', 'Medium', 'High', 'Emergency') DEFAULT 'Medium',
  incident_date DATE NOT NULL,
  description TEXT NOT NULL,
  repair_cost DECIMAL(10, 2) NOT NULL,
  cost_payer ENUM('landlord', 'tenant', 'shared') DEFAULT 'landlord',
  invoice_number VARCHAR(64) NULL,
  invoice_file_path VARCHAR(512) NULL,
  status ENUM('reported', 'under_review', 'approved', 'reimbursed', 'rejected', 'deducted_from_deposit') DEFAULT 'reported',
  admin_notes TEXT NULL,
  reimbursed_at TIMESTAMP NULL,
  transaction_ref VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (tenant_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(64) NOT NULL,
  severity ENUM('info', 'success', 'warning', 'danger') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255) NULL,
  action_text VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- INDEXES FOR HIGH QUERY CONCURRENCY
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_tenant ON units(tenant_id);
CREATE INDEX idx_agreements_landlord ON agreements(landlord_id);
CREATE INDEX idx_agreements_tenant ON agreements(tenant_id);
CREATE INDEX idx_invoices_tenant ON rent_invoices(tenant_id, status);
CREATE INDEX idx_invoices_landlord ON rent_invoices(landlord_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
