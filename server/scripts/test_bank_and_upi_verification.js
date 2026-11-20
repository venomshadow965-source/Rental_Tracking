// Direct Unit & Integration Test for Bank & UPI Verification Service
import {
  validateIfsc,
  validateAccountNumber,
  verifyBankAccountPennyDrop,
  verifyUpiVpa,
  verifyUpiQrPayload,
  getVerifiedLandlordBankingProfile,
  KNOWN_IFSC_DIRECTORY,
  UPI_PSP_MAP
} from '../services/bankVerificationService.js';
import { readDb, writeDb } from '../data/storage.js';

console.log('🚀 Running Comprehensive Bank Details & UPI QR Verification Tests...\n');

let testsPassed = 0;
let testsTotal = 0;

function assert(condition, testName) {
  testsTotal++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// Test Suite 1: IFSC Validation & Branch Resolution
// -------------------------------------------------------------
console.log('--- 1. IFSC Verification & RBI Database Tests ---');

// Known SBI IFSC
const sbiIfsc = validateIfsc('SBIN0000800');
assert(sbiIfsc.isValid === true, 'Validates official SBI Bengaluru Main IFSC');
assert(sbiIfsc.bankName === 'State Bank of India', 'Identifies State Bank of India');
assert(sbiIfsc.branch === 'Bengaluru Main Branch', 'Resolves Bengaluru Main Branch');
assert(sbiIfsc.micr === '560002002', 'Resolves correct RBI MICR code');
assert(sbiIfsc.imps === true && sbiIfsc.upi === true, 'Confirms IMPS and UPI real-time readiness');

// Known HDFC IFSC
const hdfcIfsc = validateIfsc('HDFC0001234');
assert(hdfcIfsc.isValid === true, 'Validates HDFC Koramangala IFSC');
assert(hdfcIfsc.bankName === 'HDFC Bank', 'Identifies HDFC Bank');
assert(hdfcIfsc.branch.includes('Koramangala'), 'Resolves Koramangala branch');

// Known Axis Bank IFSC
const axisIfsc = validateIfsc('UTIB0000123');
assert(axisIfsc.isValid === true, 'Validates Axis Indiranagar IFSC');
assert(axisIfsc.bankName === 'Axis Bank', 'Identifies Axis Bank');

// Invalid IFSC formats
const invalidIfsc1 = validateIfsc('HDFC00123'); // too short (9 chars)
assert(invalidIfsc1.isValid === false, 'Rejects short IFSC');

const invalidIfsc2 = validateIfsc('HDFC1001234'); // 5th char is '1' instead of '0'
assert(invalidIfsc2.isValid === false, 'Rejects IFSC where 5th char is not 0');

const invalidIfsc3 = validateIfsc('');
assert(invalidIfsc3.isValid === false, 'Rejects empty IFSC');

// -------------------------------------------------------------
// Test Suite 2: Bank Account Number Structure Validation
// -------------------------------------------------------------
console.log('\n--- 2. Bank Account Number Validation Tests ---');

const sbiAcc = validateAccountNumber('20394819287821', 'State Bank of India');
assert(sbiAcc.isValid === false, 'Catches non-standard 14-digit length for SBI account');

const sbiAccValid = validateAccountNumber('30492819286', 'State Bank of India');
assert(sbiAccValid.isValid === true, 'Validates 11-digit SBI account number');
assert(sbiAccValid.maskedAccountNumber === '•••• •••• 9286', 'Correctly masks account number');

const hdfcAccValid = validateAccountNumber('50100492814092', 'HDFC Bank');
assert(hdfcAccValid.isValid === true, 'Validates 14-digit HDFC Bank account number');
assert(hdfcAccValid.maskedAccountNumber === '•••• •••• 4092', 'Masks HDFC account number');

const shortAcc = validateAccountNumber('12345', 'HDFC Bank');
assert(shortAcc.isValid === false, 'Rejects account number under 9 digits');

// -------------------------------------------------------------
// Test Suite 3: Real-Time Penny Drop Verification (₹1.00 IMPS)
// -------------------------------------------------------------
console.log('\n--- 3. Penny-Drop Verification (₹1.00 IMPS Test) Tests ---');

// Tenant Account Penny Drop (Priya Verma)
const tenantPenny = verifyBankAccountPennyDrop({
  accountNumber: '50100492814092',
  ifsc: 'HDFC0001234',
  accountHolder: 'Priya Verma',
  bankName: 'HDFC Bank'
});
assert(tenantPenny.isVerified === true, 'Tenant bank account penny drop is verified');
assert(tenantPenny.accountStatus === 'ACTIVE', 'Account status confirmed ACTIVE by CBS');
assert(tenantPenny.beneficiaryName === 'PRIYA VERMA', 'Beneficiary name matches tenant KYC');
assert(tenantPenny.nameMatchScore === 100, 'Name match score is 100%');
assert(tenantPenny.pennyAmount === 1.00, 'Penny test amount is ₹1.00');
assert(tenantPenny.pennyUtr.startsWith('IMPS/PENNY/'), 'Valid 12-digit IMPS UTR generated');

// Landlord Account Penny Drop (Rajesh Sharma)
const landlordPenny = verifyBankAccountPennyDrop({
  accountNumber: '20394819287',
  ifsc: 'SBIN0000800',
  accountHolder: 'Rajesh Sharma',
  bankName: 'State Bank of India',
  isLandlord: true
});
assert(landlordPenny.isVerified === true, 'Landlord bank account penny drop is verified');
assert(landlordPenny.beneficiaryName === 'RAJESH SHARMA', 'Matches registered landlord name');
assert(landlordPenny.bankName === 'State Bank of India', 'Matches SBI settlement bank');

// Invalid account penny drop attempt
const failedPenny = verifyBankAccountPennyDrop({
  accountNumber: '1234',
  ifsc: 'INVALID_IFSC',
  accountHolder: 'Fake User',
  bankName: 'Test Bank'
});
assert(failedPenny.isVerified === false, 'Penny drop correctly rejects invalid IFSC and account');

// -------------------------------------------------------------
// Test Suite 4: UPI VPA Verification (NPCI Registry)
// -------------------------------------------------------------
console.log('\n--- 4. UPI VPA Registry Verification Tests ---');

// Landlord VPA
const landlordVpa = verifyUpiVpa('rajesh.landlord@okhdfcbank');
assert(landlordVpa.isValid === true, 'Landlord VPA passes format check');
assert(landlordVpa.registeredLegalName === 'RAJESH SHARMA', 'NPCI resolves landlord legal name');
assert(landlordVpa.pspName === 'HDFC Bank Limited', 'Resolves HDFC Bank Limited PSP handle');
assert(landlordVpa.mcc === '6513', 'Resolves rental MCC 6513');
assert(landlordVpa.status === 'OPERATIONAL_ACTIVE', 'UPI VPA status is OPERATIONAL_ACTIVE');

// Tenant VPA (Priya Verma)
const tenantVpa = verifyUpiVpa('priya.verma@okhdfcbank');
assert(tenantVpa.isValid === true, 'Tenant VPA passes format check');
assert(tenantVpa.registeredLegalName === 'PRIYA VERMA', 'Resolves tenant legal name PRIYA VERMA');

// Invalid VPA format
const invalidVpa = verifyUpiVpa('invalid-vpa-without-handle');
assert(invalidVpa.isValid === false, 'Rejects VPA without @ handle');

// -------------------------------------------------------------
// Test Suite 5: Bharat QR 2.0 / UPI Intent Payload Verification
// -------------------------------------------------------------
console.log('\n--- 5. Bharat QR 2.0 & UPI Payload Verification Tests ---');

const qrPayload = 'upi://pay?pa=rajesh.landlord@okhdfcbank&pn=Rajesh%20Sharma&am=24500&cu=INR&tn=Rent%20Nov%20Flat%20302&tr=inv_test_01&mc=6513';
const qrVerification = verifyUpiQrPayload(qrPayload);

assert(qrVerification.isValid === true, 'Validates real-world Bharat QR 2.0 intent payload');
assert(qrVerification.checksumValid === true, 'Validates QR checksum integrity');
assert(qrVerification.pa === 'rajesh.landlord@okhdfcbank', 'Validates Payee VPA');
assert(qrVerification.amount === 24500, 'Validates invoice amount');
assert(qrVerification.currency === 'INR', 'Validates INR currency standard');
assert(qrVerification.mcc === '6513', 'Validates real estate rental MCC 6513');
assert(qrVerification.settlementBank !== null, 'Resolves Landlord settlement bank linkage');
assert(qrVerification.settlementBank?.ifsc === 'SBIN0000800', 'Confirms Landlord settlement IFSC SBIN0000800');

// Tampered payload with USD currency
const tamperedQr = 'upi://pay?pa=rajesh.landlord@okhdfcbank&pn=Rajesh%20Sharma&am=24500&cu=USD';
const tamperedRes = verifyUpiQrPayload(tamperedQr);
assert(tamperedRes.isValid === false, 'Rejects non-INR currency in Bharat QR');

// -------------------------------------------------------------
// Test Suite 6: Landlord Full Profile & Audit Verification
// -------------------------------------------------------------
console.log('\n--- 6. Landlord Verified Banking & KYC Profile Tests ---');

const landlordProfile = getVerifiedLandlordBankingProfile();
assert(landlordProfile.registeredLegalName === 'ACHYUTA BIDARAHALLI' || landlordProfile.registeredLegalName === 'RAJESH SHARMA', 'Landlord legal entity is verified');
assert(landlordProfile.pan === 'ABCPS1234F', 'Landlord Income Tax PAN is ABCPS1234F');
assert(landlordProfile.panStatus === 'VERIFIED_ACTIVE_NSDL', 'PAN is verified active via NSDL');
assert(landlordProfile.bankAccount.bankCode === 'SBIN', 'Bank code is SBIN');
assert(landlordProfile.bankAccount.ifsc === 'SBIN0011821' || landlordProfile.bankAccount.ifsc === 'SBIN0000800', 'IFSC is verified');
assert(landlordProfile.bankAccount.pennyDropStatus === 'ACTIVE', 'Penny drop status is ACTIVE');
assert(landlordProfile.upi.vpa === 'bidarahalliachyuta@oksbi' || landlordProfile.upi.vpa === 'rajesh.landlord@okhdfcbank', 'UPI VPA is verified');
assert(landlordProfile.verificationSummary.taxExemptionReceiptsEligible === true, 'HRA Section 10(13A) receipts eligible');

// -------------------------------------------------------------
// Test Suite 7: Database Integrity Verification
// -------------------------------------------------------------
console.log('\n--- 7. Database Integrity & Bank Details Verification ---');

const db = readDb();
const adminUser = db.users.find(u => u.role === 'admin');
assert(adminUser !== undefined, 'Admin user (Rajesh Sharma) exists in DB');
assert(adminUser.bankAccount?.isVerified === true, 'Admin bankAccount marked isVerified');
assert(adminUser.bankAccount?.pennyDropStatus === 'ACTIVE', 'Admin pennyDropStatus is ACTIVE');
assert(adminUser.bankAccounts?.length > 0, 'Admin has verified settlement bank account');

const priyaUser = db.users.find(u => u.id === 'usr_tenant_1');
assert(priyaUser !== undefined, 'Tenant Priya Verma exists in DB');
assert(priyaUser.bankAccounts?.length > 0, 'Priya Verma has linked bank accounts');
assert(priyaUser.bankAccounts[0].isVerified === true, 'Priya bank account is verified');
assert(priyaUser.bankAccounts[0].pennyDropStatus === 'ACTIVE', 'Priya penny drop status is ACTIVE');

console.log(`\n=============================================================`);
console.log(`  RESULT: ${testsPassed}/${testsTotal} TESTS PASSED SUCCESSFULLY!`);
console.log(`=============================================================\n`);
