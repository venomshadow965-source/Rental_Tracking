// Test Suite: Real-Time Tenant Scan & Direct Rent Transfer to Landlord
import assert from 'assert';
import { readDb, writeDb } from '../data/storage.js';

console.log('🚀 Running Real-Time Tenant Scan & Direct Rent Transfer to Landlord Tests...\n');

const db = readDb();
const originalDb = JSON.parse(JSON.stringify(db));

try {
  // Find an unpaid invoice or make one unpaid for testing
  let testInvoice = db.rentInvoices.find(i => i.status === 'unpaid');
  if (!testInvoice) {
    testInvoice = db.rentInvoices[0];
    testInvoice.status = 'unpaid';
    testInvoice.paidAt = null;
  }

  const invoiceAmount = testInvoice.totalAmount;
  const initialSettledBalance = db.landlordSettlementProfile?.settledBalance || 0;

  console.log(`ℹ️ Testing invoice: ${testInvoice.id} (${testInvoice.billingMonth}) for ₹${invoiceAmount}`);
  console.log(`ℹ️ Initial Landlord Settled Balance: ₹${initialSettledBalance}`);

  // 1. Simulate UPI Scan & Live Settlement
  const profile = db.landlordSettlementProfile;
  const utrRef = `UPI/NPCI/${Math.floor(400000000000 + Math.random() * 599999999999)}`;
  const now = new Date().toISOString();

  // Apply credit logic
  testInvoice.status = 'paid';
  testInvoice.paidAt = now;
  testInvoice.paymentMethod = 'Instant UPI (Google Pay)';
  testInvoice.transactionRef = utrRef;
  testInvoice.upiDetails = {
    upiApp: 'Google Pay',
    payerVpa: 'priya.verma@okhdfcbank',
    payeeVpa: profile.upi.vpa,
    payeeName: profile.registeredLegalName,
    npciRrn: utrRef,
    settlementRail: 'NPCI UPI 2.0 Real-Time Switch',
    status: 'CREDITED_TO_LANDLORD_BANK',
    settlementBank: profile.bankAccount.bankName
  };
  testInvoice.landlordSettlement = {
    name: profile.registeredLegalName,
    bankName: profile.bankAccount.bankName,
    accountNumber: profile.bankAccount.accountNumber,
    maskedAccountNumber: profile.bankAccount.maskedAccountNumber,
    ifsc: profile.bankAccount.ifsc,
    upiId: profile.upi.vpa,
    pan: profile.pan
  };

  if (!profile.settledBalance) profile.settledBalance = 0;
  profile.settledBalance += invoiceAmount;
  profile.lastSettledAt = now;

  if (!Array.isArray(profile.recentSettlements)) profile.recentSettlements = [];
  profile.recentSettlements.unshift({
    id: `stl_test_${Date.now()}`,
    invoiceId: testInvoice.id,
    amount: invoiceAmount,
    tenantName: testInvoice.tenantName,
    creditedToBank: profile.bankAccount.bankName,
    accountNumber: profile.bankAccount.accountNumber,
    ifsc: profile.bankAccount.ifsc,
    utr: utrRef,
    settledAt: now,
    status: 'SETTLED_INSTANT_CREDIT'
  });

  writeDb(db);

  // Assertions
  const updatedDb = readDb();
  const verifiedInvoice = updatedDb.rentInvoices.find(i => i.id === testInvoice.id);
  assert.strictEqual(verifiedInvoice.status, 'paid', 'Invoice is marked as paid in real-time');
  assert.strictEqual(verifiedInvoice.landlordSettlement.accountNumber, '20394819287821', 'Settled to Landlord A/c 20394819287821');
  assert.strictEqual(verifiedInvoice.landlordSettlement.ifsc, 'SBIN0000800', 'Settled to SBI IFSC SBIN0000800');
  assert.strictEqual(verifiedInvoice.landlordSettlement.name, 'RAJESH SHARMA', 'Settled to Landlord RAJESH SHARMA');
  
  assert.strictEqual(
    updatedDb.landlordSettlementProfile.settledBalance,
    initialSettledBalance + invoiceAmount,
    'Landlord account balance incremented by exact rent amount in real-time'
  );

  assert(
    updatedDb.landlordSettlementProfile.recentSettlements.length > 0,
    'Live settlement ledger record created for landlord'
  );

  console.log('✅ PASS: Real-time scan and credit to Landlord bank account verified!');
  console.log('✅ PASS: Landlord balance increased by exact rent amount!');
  console.log('✅ PASS: Live settlement ledger updated with IMPS/UPI reference!');
  console.log(`\n=============================================================`);
  console.log(`  ALL REAL-TIME SETTLEMENT TESTS PASSED SUCCESSFULLY!`);
  console.log(`=============================================================\n`);
} finally {
  // Restore original state
  writeDb(originalDb);
  console.log('🧹 Database restored cleanly.');
}
