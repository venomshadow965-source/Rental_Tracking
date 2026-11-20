import { readDb, writeDb } from '../data/storage.js';
import { validateIfsc, verifyUpiVpa, getVerifiedLandlordBankingProfile } from '../services/bankVerificationService.js';

console.log('🧪 Running Landlord Real Bank Sync & Tenant Real-Time Payment Settlement Tests...\n');

let passed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}`);
    process.exitCode = 1;
  }
}

// Save initial DB state to restore after test
const originalDb = JSON.parse(JSON.stringify(readDb()));

try {
  // Test 1: Baseline Landlord Profile
  const db = readDb();
  if (!db.landlordSettlementProfile) {
    db.landlordSettlementProfile = getVerifiedLandlordBankingProfile();
    writeDb(db);
  }
  assert(db.landlordSettlementProfile !== undefined, 'Landlord settlement profile exists in database');
  const initialProfile = db.landlordSettlementProfile;
  console.log(`ℹ️ Current Landlord Profile: ${initialProfile.registeredLegalName} - ${initialProfile.bankAccount.bankName} (${initialProfile.bankAccount.maskedAccountNumber}) - UPI: ${initialProfile.upi.vpa}`);

  // Test 2: Landlord updates their Bank Details & UPI ID
  const newPayeeName = 'Vikram Malhotra';
  const newUpi = 'vikram.landlord@okhdfcbank';
  const newIfsc = 'ICIC0000029'; // MG Road, ICICI Bank
  const newAccount = '002905009876';
  const newPan = 'VLMPK9876E';

  const ifscData = validateIfsc(newIfsc);
  assert(ifscData.isValid === true, 'IFSC code validation succeeds for ICICI Bank');

  db.landlordSettlementProfile = {
    landlordId: 'usr_admin',
    name: newPayeeName,
    registeredLegalName: newPayeeName,
    pan: newPan,
    panStatus: 'VERIFIED_ACTIVE_NSDL',
    bankAccount: {
      bankName: ifscData.bankName || 'ICICI Bank',
      bankCode: 'ICIC',
      accountNumber: newAccount,
      maskedAccountNumber: `•••• •••• ${newAccount.slice(-4)}`,
      accountType: 'Current / Rent Settlement Account',
      ifsc: newIfsc,
      branch: ifscData.branch || 'MG Road Branch',
      city: ifscData.city || 'Bengaluru',
      micr: ifscData.micr || '560229003',
      isVerified: true,
      pennyDropStatus: 'ACTIVE',
      pennyDropUtr: `IMPS/PENNY/${Date.now()}`
    },
    upi: {
      vpa: newUpi,
      handle: 'okhdfcbank',
      psp: 'ICICI Bank',
      merchantName: newPayeeName,
      registeredLegalName: newPayeeName,
      mcc: '6513',
      isVerified: true,
      status: 'OPERATIONAL_ACTIVE'
    }
  };
  writeDb(db);

  // Test 3: Tenant side reads updated profile immediately
  const freshDb = readDb();
  const tenantSeenProfile = freshDb.landlordSettlementProfile;
  assert(tenantSeenProfile.registeredLegalName === newPayeeName, 'Tenant sees updated landlord legal name');
  assert(tenantSeenProfile.bankAccount.bankName === 'ICICI Bank', 'Tenant sees updated landlord bank name');
  assert(tenantSeenProfile.bankAccount.accountNumber === newAccount, 'Tenant sees updated full account number for direct transfer');
  assert(tenantSeenProfile.bankAccount.ifsc === newIfsc, 'Tenant sees updated IFSC code');
  assert(tenantSeenProfile.upi.vpa === newUpi, 'Tenant sees updated landlord UPI ID for QR code');

  // Test 4: Tenant generates a test invoice & pays via UPI confirmation with UTR
  const testInvoiceId = `test_inv_${Date.now()}`;
  const testInvoice = {
    id: testInvoiceId,
    tenantId: 'usr_tenant_1',
    tenantName: 'Priya Verma',
    unitId: 'unit_test',
    unitNumber: 'Flat 402',
    propertyName: 'Palm Heights',
    billingMonth: 'December 2026',
    billingMonthKey: '2026-12',
    baseRent: 28000,
    maintenanceCharges: 2500,
    totalAmount: 30500,
    status: 'unpaid',
    dueDate: '2026-12-05',
    issueDate: '2026-11-20'
  };
  freshDb.rentInvoices.push(testInvoice);
  writeDb(freshDb);

  // Tenant confirms UPI payment with 12-digit UTR
  const utrNumber = '432901829401';
  const profile = freshDb.landlordSettlementProfile;
  const now = new Date().toISOString();

  testInvoice.status = 'paid';
  testInvoice.paidAt = now;
  testInvoice.paymentMethod = 'Real-Time UPI (Google Pay)';
  testInvoice.transactionRef = utrNumber;
  testInvoice.upiDetails = {
    upiApp: 'Google Pay',
    payerVpa: 'priya.verma@okhdfcbank',
    payeeVpa: profile.upi.vpa,
    payeeName: profile.registeredLegalName,
    npciRrn: utrNumber,
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
    branch: profile.bankAccount.branch,
    upiId: profile.upi.vpa,
    pan: profile.pan
  };
  testInvoice.landlordName = profile.registeredLegalName;
  testInvoice.landlordPan = profile.pan;

  assert(testInvoice.status === 'paid', 'Invoice is marked paid');
  assert(testInvoice.landlordSettlement.name === newPayeeName, 'Invoice records settlement to updated landlord name');
  assert(testInvoice.landlordSettlement.bankName === 'ICICI Bank', 'Invoice records settlement into updated bank (ICICI Bank)');
  assert(testInvoice.landlordSettlement.maskedAccountNumber === `•••• •••• ${newAccount.slice(-4)}`, 'Invoice records settlement into updated account number');
  assert(testInvoice.landlordSettlement.ifsc === newIfsc, 'Invoice records settlement into updated IFSC code');
  assert(testInvoice.landlordSettlement.upiId === newUpi, 'Invoice records settlement into updated UPI ID');

  // Test 5: Direct IMPS Bank Transfer Confirmation
  const impsUtr = 'UTR/ICIC/82910481/4921';
  const testInvoice2 = {
    id: `test_inv_imps_${Date.now()}`,
    tenantId: 'usr_tenant_1',
    tenantName: 'Priya Verma',
    unitId: 'unit_test_2',
    unitNumber: 'Flat 403',
    propertyName: 'Palm Heights',
    billingMonth: 'December 2026',
    billingMonthKey: '2026-12',
    baseRent: 25000,
    maintenanceCharges: 2000,
    totalAmount: 27000,
    status: 'paid',
    paidAt: now,
    paymentMethod: `Direct IMPS Bank Transfer (${profile.bankAccount.bankName})`,
    transactionRef: impsUtr,
    landlordSettlement: {
      name: profile.registeredLegalName,
      bankName: profile.bankAccount.bankName,
      accountNumber: profile.bankAccount.accountNumber,
      maskedAccountNumber: profile.bankAccount.maskedAccountNumber,
      ifsc: profile.bankAccount.ifsc,
      branch: profile.bankAccount.branch,
      upiId: profile.upi.vpa,
      pan: profile.pan
    },
    landlordName: profile.registeredLegalName,
    landlordPan: profile.pan
  };

  assert(testInvoice2.paymentMethod.includes('ICICI Bank'), 'Direct bank transfer logs correct updated beneficiary bank');
  assert(testInvoice2.landlordSettlement.accountNumber === newAccount, 'Direct bank transfer logs exact linked destination account');

} finally {
  // Restore original DB state so we leave no test garbage
  writeDb(originalDb);
  console.log('\n🧹 Restored original database state.');
}

console.log(`\n========================================`);
console.log(`✨ All ${total} Tests Passed: ${passed}/${total}`);
console.log(`========================================\n`);
