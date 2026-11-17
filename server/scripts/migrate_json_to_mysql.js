/**
 * KirayaSetu Automated Data Migration Script: JSON to MySQL
 * 
 * Usage:
 *   1. Install mysql2: npm install mysql2 dotenv
 *   2. Set env variables in server/.env:
 *        MYSQL_HOST=localhost
 *        MYSQL_PORT=3306
 *        MYSQL_USER=root
 *        MYSQL_PASSWORD=your_password
 *        MYSQL_DATABASE=kirayasetu_db
 *   3. Run: node server/scripts/migrate_json_to_mysql.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');
const SCHEMA_SQL_PATH = path.join(__dirname, '../data/schema.mysql.sql');

function formatMysqlDatetime(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function formatMysqlDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function migrate() {
  console.log('🚀 Starting KirayaSetu JSON -> MySQL Database Migration...\n');

  if (!fs.existsSync(DB_JSON_PATH)) {
    console.error('❌ Error: db.json not found at', DB_JSON_PATH);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(DB_JSON_PATH, 'utf-8');
  const dbData = JSON.parse(rawJson);

  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true
  };

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log(`✅ Connected to MySQL server at ${config.host}:${config.port}`);

    // Check if database exists, if not create it
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE || 'kirayasetu_db'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.changeUser({ database: process.env.MYSQL_DATABASE || 'kirayasetu_db' });

    // Check if tables already exist
    const [existingTables] = await connection.query("SHOW TABLES LIKE 'users'");
    if (existingTables.length === 0 && fs.existsSync(SCHEMA_SQL_PATH)) {
      console.log('📦 Executing schema.mysql.sql...');
      const schemaSql = fs.readFileSync(SCHEMA_SQL_PATH, 'utf-8');
      await connection.query(schemaSql);
      console.log('✅ Schema & tables created successfully.');
    } else {
      console.log('✅ Database tables already initialized.');
    }

    // 1. Migrate Users
    console.log(`\n⏳ Migrating ${dbData.users.length} Users...`);
    for (const u of dbData.users) {
      await connection.execute(
        `INSERT INTO users (id, role, name, email, phone, password, pan, aadhaar, address, permanent_address, avatar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), pan=VALUES(pan), aadhaar=VALUES(aadhaar)`,
        [u.id, u.role, u.name, u.email, u.phone, u.password, u.pan || null, u.aadhaar || null, u.address || null, u.permanentAddress || null, u.avatar || null]
      );
    }
    console.log('✅ Users migrated.');

    // 2. Migrate Properties & Units
    console.log(`\n⏳ Migrating ${dbData.properties.length} Properties & Units...`);
    for (const p of dbData.properties) {
      await connection.execute(
        `INSERT INTO properties (id, landlord_id, name, property_type, address, city, state, pincode, latitude, longitude, landmarks, google_maps_url, directions_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address), latitude=VALUES(latitude), longitude=VALUES(longitude)`,
        [
          p.id,
          p.landlordId || 'usr_admin',
          p.name,
          p.propertyType || 'Multi-family Residential Building',
          p.address,
          p.city || 'Bengaluru',
          p.state || 'Karnataka',
          p.pincode || '560034',
          p.latitude || null,
          p.longitude || null,
          JSON.stringify(p.landmarks || []),
          p.googleMapsUrl || null,
          p.directionsUrl || null
        ]
      );

      for (const u of (p.units || [])) {
        await connection.execute(
          `INSERT INTO units (id, property_id, number, floor, type, rent, maintenance, deposit, status, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE rent=VALUES(rent), status=VALUES(status), tenant_id=VALUES(tenant_id)`,
          [u.id, p.id, u.number, u.floor, u.type, u.rent, u.maintenance || 0, u.deposit, u.status || 'vacant', u.tenantId || null]
        );
      }
    }
    console.log('✅ Properties & Units migrated.');

    // 3. Migrate Agreements
    console.log(`\n⏳ Migrating ${(dbData.agreements || []).length} Agreements...`);
    for (const a of (dbData.agreements || [])) {
      let resolvedTenantId = a.tenantId;
      if (!resolvedTenantId || !dbData.users.some(u => u.id === resolvedTenantId)) {
        const match = dbData.users.find(u => (a.tenantEmail && u.email === a.tenantEmail) || (a.tenantName && u.name === a.tenantName));
        resolvedTenantId = match ? match.id : (dbData.users.find(u => u.role === 'tenant')?.id || 'usr_tenant_1');
      }

      await connection.execute(
        `INSERT INTO agreements (
           id, agreement_number, property_id, unit_id, landlord_id, tenant_id,
           landlord_name, landlord_father_name, landlord_aadhaar, landlord_pan, landlord_phone, landlord_address,
           tenant_name, tenant_father_name, tenant_aadhaar, tenant_pan, tenant_phone, tenant_email, tenant_permanent_address,
           term_months, start_date, end_date, monthly_rent, security_deposit, maintenance_charges,
           rent_due_date_day, lock_in_period_months, notice_period_months, annual_escalation_percent,
           electricity_meter_no, electricity_consumer_id, water_meter_no, water_consumer_id,
           stamp_certificate_no, stamp_duty_amount, stamp_issue_state,
           witness1_name, witness1_address, witness2_name, witness2_address,
           status, landlord_signed, landlord_signed_at, tenant_signed, tenant_signed_at, tenant_signature_ref, notes
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), tenant_signed=VALUES(tenant_signed)`,
        [
          a.id, a.agreementNumber, a.propertyId, a.unitId, a.landlordId || 'usr_admin', resolvedTenantId,
          a.landlordName, a.landlordFatherName || null, a.landlordAadhaar || null, a.landlordPan || null, a.landlordPhone || null, a.landlordAddress || null,
          a.tenantName, a.tenantFatherName || null, a.tenantAadhaar, a.tenantPan || null, a.tenantPhone, a.tenantEmail || null, a.tenantPermanentAddress || null,
          a.termMonths || 11, formatMysqlDate(a.startDate), formatMysqlDate(a.endDate), a.monthlyRent, a.securityDeposit, a.maintenanceCharges || 0,
          a.rentDueDateDay || 5, a.lockInPeriodMonths || 3, a.noticePeriodMonths || 1, a.annualEscalationPercent || 5,
          a.electricityMeterNo || null, a.electricityConsumerId || null, a.waterMeterNo || null, a.waterConsumerId || null,
          a.stampCertificateNo || null, a.stampDutyAmount || 500, a.stampIssueState || 'Government of Karnataka',
          a.witness1Name || null, a.witness1Address || null, a.witness2Name || null, a.witness2Address || null,
          a.status || 'sent_to_tenant', a.landlordSigned ? 1 : 0, formatMysqlDatetime(a.landlordSignedAt), a.tenantSigned ? 1 : 0, formatMysqlDatetime(a.tenantSignedAt), a.tenantSignatureRef || null, a.notes || null
        ]
      );
    }
    console.log('✅ Agreements migrated.');

    // 4. Migrate Invoices
    console.log(`\n⏳ Migrating ${(dbData.rentInvoices || []).length} Invoices...`);
    for (const inv of (dbData.rentInvoices || [])) {
      const propId = inv.propertyId || dbData.properties.find(p => (p.units || []).some(u => u.id === inv.unitId))?.id || 'prop_1';
      const landlordId = inv.landlordId || dbData.properties.find(p => p.id === propId)?.landlordId || 'usr_admin';

      await connection.execute(
        `INSERT INTO rent_invoices (id, invoice_number, property_id, unit_id, landlord_id, tenant_id, billing_month, base_rent, maintenance_charges, water_charges, electricity_charges, total_amount, due_date, status, paid_at, payment_method, transaction_ref, receipt_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), paid_at=VALUES(paid_at)`,
        [
          inv.id,
          inv.invoiceNumber,
          propId,
          inv.unitId,
          landlordId,
          inv.tenantId,
          inv.billingMonth,
          inv.baseRent ?? 0,
          inv.maintenanceCharges ?? 0,
          inv.waterElectricityAddon ?? 0,
          0,
          inv.totalAmount ?? 0,
          formatMysqlDate(inv.dueDate),
          inv.status || 'unpaid',
          formatMysqlDatetime(inv.paidAt),
          inv.paymentMethod || null,
          inv.transactionRef || null,
          inv.receiptNumber || null
        ]
      );
    }
    console.log('✅ Invoices migrated.');

    // 5. Migrate Government Meters
    console.log(`\n⏳ Migrating ${(dbData.meters || []).length} Government Meters...`);
    for (const m of (dbData.meters || [])) {
      const propId = m.propertyId || dbData.properties.find(p => (p.units || []).some(u => u.id === m.unitId))?.id || 'prop_1';
      await connection.execute(
        `INSERT INTO government_meters (id, property_id, unit_id, tenant_id, meter_type, utility_provider, consumer_id, meter_number, sanctioned_load, phase_type, initial_reading, current_reading, status, government_document_ref)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE current_reading=VALUES(current_reading)`,
        [
          m.id, propId, m.unitId, m.tenantId || null, m.meterType, m.utilityProvider, m.consumerId, m.meterNumber,
          m.sanctionedLoad || null, m.phaseType || 'Single Phase Domestic', m.initialReading ?? 0, m.currentReading ?? 0, m.status || 'active', m.governmentDocumentRef || null
        ]
      );
    }
    console.log('✅ Government Meters migrated.');

    // 6. Migrate Utility Bills
    console.log(`\n⏳ Migrating ${(dbData.utilityBills || []).length} Utility Bills...`);
    for (const b of (dbData.utilityBills || [])) {
      await connection.execute(
        `INSERT INTO utility_bills (id, meter_id, tenant_id, unit_id, billing_month, previous_reading, current_reading, units_consumed, rate_per_unit, fixed_charges, amount, bill_date, due_date, status, paid_at, payment_ref)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), paid_at=VALUES(paid_at)`,
        [
          b.id, b.meterId, b.tenantId, b.unitId, b.billingMonth, b.previousReading ?? 0, b.currentReading ?? 0, b.unitsConsumed ?? 0,
          b.ratePerUnit ?? 7.5, b.fixedCharges ?? 120, b.amount ?? 0, formatMysqlDate(b.billDate), formatMysqlDate(b.dueDate), b.status || 'unpaid', formatMysqlDatetime(b.paidAt), b.paymentRef || null
        ]
      );
    }
    console.log('✅ Utility Bills migrated.');

    // 7. Migrate Damage Reports
    console.log(`\n⏳ Migrating ${(dbData.damages || []).length} Damage Reports...`);
    for (const d of (dbData.damages || [])) {
      const propId = d.propertyId || dbData.properties.find(p => (p.units || []).some(u => u.id === d.unitId))?.id || 'prop_1';
      await connection.execute(
        `INSERT INTO damage_reports (id, property_id, unit_id, tenant_id, title, category, severity, incident_date, description, repair_cost, cost_payer, invoice_number, invoice_file_path, status, admin_notes, reimbursed_at, transaction_ref)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status)`,
        [
          d.id, propId, d.unitId, d.tenantId, d.title, d.category || 'Plumbing', d.severity || 'Medium',
          formatMysqlDate(d.incidentDate || new Date()), d.description, d.repairCost ?? 0, d.costPayer || 'landlord',
          d.invoice?.invoiceNumber || null, d.invoice?.fileUrl || null, d.status || 'reported',
          d.adminReview?.notes || null, formatMysqlDatetime(d.adminReview?.reimbursedAt), d.adminReview?.transactionRef || null
        ]
      );
    }
    console.log('✅ Damage Reports migrated.');

    // 8. Migrate Notifications
    console.log(`\n⏳ Migrating ${(dbData.notifications || []).length} Notifications...`);
    for (const n of (dbData.notifications || [])) {
      await connection.execute(
        `INSERT INTO notifications (id, user_id, title, message, type, severity, is_read, action_url, action_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_read=VALUES(is_read)`,
        [n.id, n.userId, n.title, n.message, n.type || 'info', n.severity || 'info', n.read ? 1 : 0, n.actionUrl || null, n.actionText || null]
      );
    }
    console.log('✅ Notifications migrated.');

    // 9. Migrate Bank Accounts (Landlord & Tenants)
    const allBankAccounts = [];
    for (const u of (dbData.users || [])) {
      for (const b of (u.bankAccounts || [])) {
        allBankAccounts.push({ ...b, userId: u.id });
      }
    }
    console.log(`\n⏳ Migrating ${allBankAccounts.length} Verified Bank Accounts...`);
    for (const b of allBankAccounts) {
      await connection.execute(
        `INSERT INTO bank_accounts (id, user_id, bank_name, account_holder, verified_beneficiary_name, account_number, masked_account_number, ifsc, branch, micr, account_type, is_default, is_verified, penny_drop_status, penny_drop_utr, rbi_recognized)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_verified=VALUES(is_verified), penny_drop_status=VALUES(penny_drop_status)`,
        [
          b.id, b.userId, b.bankName, b.accountHolder, b.verifiedBeneficiaryName || b.accountHolder,
          b.accountNumber, b.maskedAccountNumber, b.ifsc, b.branch || null, b.micr || null,
          b.accountType || 'Savings Account', b.isDefault ? 1 : 0, b.isVerified ? 1 : 0,
          b.pennyDropStatus || 'ACTIVE', b.pennyDropUtr || null, b.rbiRecognized ? 1 : 0
        ]
      );
    }
    console.log('✅ Verified Bank Accounts migrated.');

    console.log('\n🎉 ALL DATA MIGRATED TO MYSQL SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
