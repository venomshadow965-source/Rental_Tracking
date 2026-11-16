import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb, resetDb } from './data/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
app.use('/sample-invoices', express.static(uploadsDir));

// Serve static client build if present
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// Configure multer for file uploads (invoices, damage photos, meter pictures)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// Helper to get active user from header (or query/body)
function getActiveUserId(req) {
  return req.headers['x-user-id'] || req.query.userId || 'usr_admin';
}

/* ========================================================
   AUTH & USER ENDPOINTS (SEPARATE LANDLORD & TENANT AUTH)
   ======================================================== */
app.get('/api/auth/users', (req, res) => {
  const db = readDb();
  // Strip password when listing
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.json({ success: true, users: safeUsers });
});

app.get('/api/auth/current', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  const { password, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Dedicated Login for Landlord and Tenant Portals
app.post('/api/auth/login', (req, res) => {
  const db = readDb();
  const { identifier, password, portalType } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email/phone and password.' });
  }

  // Find user by email or phone or ID
  const cleanId = identifier.trim().toLowerCase();
  const user = db.users.find(u => 
    u.email.toLowerCase() === cleanId || 
    u.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
    u.id.toLowerCase() === cleanId
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'No account found with this email or phone number.' });
  }

  // Validate password (in production use bcrypt, here supports password123 or registered password)
  if (user.password && user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
  }

  // Strict Portal Type Authorization Separation
  if (portalType === 'landlord' && user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      code: 'PORTAL_MISMATCH',
      message: 'Access Denied: You are trying to log in as a Tenant through the Landlord Portal. Please use the Tenant Resident Portal.'
    });
  }

  if (portalType === 'tenant' && user.role !== 'tenant') {
    return res.status(403).json({
      success: false,
      code: 'PORTAL_MISMATCH',
      message: 'Access Denied: You are trying to log in as a Landlord through the Tenant Resident Portal. Please use the Landlord Management Portal.'
    });
  }

  const token = `jwt_token_${user.id}_${Date.now()}`;
  const { password: _, ...safeUser } = user;

  res.json({
    success: true,
    token,
    user: safeUser,
    message: `Welcome back, ${user.name}!`
  });
});

// Separate Registration for Landlord and Tenant
app.post('/api/auth/register', (req, res) => {
  const db = readDb();
  const {
    portalType, // 'landlord' or 'tenant'
    name,
    email,
    phone,
    password,
    pan,
    aadhaar,
    permanentAddress,
    propertyAddress,
    unitId
  } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'Please provide Name, Email, Phone, and Password.' });
  }

  // Check if email already registered
  const exists = db.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return res.status(409).json({ success: false, message: 'An account with this email is already registered.' });
  }

  const userId = `usr_${portalType}_${Date.now()}`;
  const role = portalType === 'landlord' ? 'admin' : 'tenant';

  // For tenant, link to unit if selected
  let assignedUnit = null;
  let assignedProp = null;
  if (role === 'tenant' && unitId) {
    db.properties.forEach(p => {
      const u = p.units.find(un => un.id === unitId);
      if (u) {
        assignedUnit = u;
        assignedProp = p;
        u.status = 'occupied';
        u.tenantId = userId;
        u.tenantName = name;
      }
    });
  }

  const newUser = {
    id: userId,
    role,
    name,
    email: email.trim().toLowerCase(),
    phone,
    password,
    pan: pan ? pan.toUpperCase() : (role === 'admin' ? 'ABCPS9999F' : 'DEFPT1111E'),
    aadhaar: aadhaar || '1234-5678-9012',
    address: propertyAddress || permanentAddress || 'Bengaluru, Karnataka',
    permanentAddress: permanentAddress || propertyAddress || 'Bengaluru, Karnataka',
    assignedUnitId: assignedUnit ? assignedUnit.id : 'unit_302',
    propertyId: assignedProp ? assignedProp.id : 'prop_1',
    unitNumber: assignedUnit ? assignedUnit.number : 'Flat 302',
    propertyName: assignedProp ? assignedProp.name : 'Palm Heights Apartments',
    monthlyRent: assignedUnit ? assignedUnit.rent : 20000,
    maintenance: assignedUnit ? assignedUnit.maintenance : 2000,
    securityDeposit: assignedUnit ? assignedUnit.deposit : 100000,
    moveInDate: new Date().toISOString().split('T')[0],
    avatar: role === 'admin' 
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  db.users.push(newUser);

  // If newly registered user is a tenant, notify all Landlord Admins immediately
  if (role === 'tenant') {
    const adminUsers = db.users.filter(u => u.role === 'admin');
    adminUsers.forEach(admin => {
      db.notifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: admin.id,
        title: `New Tenant Registered: ${name}`,
        message: `${name} has registered on the tenant portal for ${newUser.unitNumber} (${newUser.propertyName}). Aadhaar: ${newUser.aadhaar}. Ready to draft and issue official rental agreement.`,
        type: 'tenant_registered',
        severity: 'info',
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/agreements?createTenant=${newUser.id}`,
        actionText: 'Make Rental Agreement',
        tenantId: newUser.id,
        tenantName: newUser.name,
        unitId: newUser.assignedUnitId,
        unitNumber: newUser.unitNumber,
        aadhaar: newUser.aadhaar
      });
    });
  }

  writeDb(db);

  const token = `jwt_token_${newUser.id}_${Date.now()}`;
  const { password: _, ...safeUser } = newUser;

  res.status(201).json({
    success: true,
    token,
    user: safeUser,
    message: `${role === 'admin' ? 'Landlord' : 'Tenant'} account created successfully!`
  });
});

/* ========================================================
   PROPERTIES & UNITS
   ======================================================== */
app.get('/api/properties', (req, res) => {
  const db = readDb();
  res.json({ success: true, properties: db.properties });
});

app.get('/api/units', (req, res) => {
  const db = readDb();
  const allUnits = [];
  db.properties.forEach(p => {
    p.units.forEach(u => {
      allUnits.push({
        ...u,
        propertyId: p.id,
        propertyName: p.name,
        propertyAddress: `${p.address}, ${p.city}, ${p.state} - ${p.pincode}`
      });
    });
  });
  res.json({ success: true, units: allUnits });
});

/* ========================================================
   RENTAL AGREEMENTS (Indian Government Legal Template)
   ======================================================== */
app.get('/api/agreements', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  let agreements = db.agreements;
  // If tenant, only show agreements where they are the tenant
  if (currentUser && currentUser.role === 'tenant') {
    agreements = agreements.filter(a => a.tenantId === userId);
  }

  res.json({ success: true, agreements });
});

app.get('/api/agreements/:id', (req, res) => {
  const db = readDb();
  const agreement = db.agreements.find(a => a.id === req.params.id);
  if (!agreement) {
    return res.status(404).json({ success: false, message: 'Agreement not found' });
  }
  res.json({ success: true, agreement });
});

// Admin creates new agreement
app.post('/api/agreements', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  if (currentUser && currentUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admin can create rental agreements.' });
  }

  const {
    propertyId,
    unitId,
    tenantId,
    tenantName,
    tenantFatherName,
    tenantAadhaar,
    tenantPan,
    tenantPhone,
    tenantEmail,
    tenantPermanentAddress,
    landlordName,
    landlordFatherName,
    landlordAadhaar,
    landlordPan,
    landlordPhone,
    landlordAddress,
    termMonths = 11,
    startDate,
    endDate,
    monthlyRent,
    monthlyRentInWords,
    securityDeposit,
    securityDepositInWords,
    maintenanceCharges = 0,
    rentDueDateDay = 5,
    lockInPeriodMonths = 3,
    noticePeriodMonths = 1,
    annualEscalationPercent = 5,
    electricityMeterNo = '',
    electricityConsumerId = '',
    waterMeterNo = '',
    waterConsumerId = '',
    stampCertificateNo = `IN-KA${Date.now().toString().slice(-8)}U`,
    stampDutyAmount = 500,
    stampIssueState = 'Government of Karnataka',
    witness1Name = 'Witness 1',
    witness1Address = 'Bengaluru',
    witness2Name = 'Witness 2',
    witness2Address = 'Bengaluru',
    notes = ''
  } = req.body;

  // Resolve property and unit details
  const prop = db.properties.find(p => p.id === propertyId);
  const unit = prop ? prop.units.find(u => u.id === unitId) : null;
  const propertyName = prop ? prop.name : 'Residential Property';
  const unitNumber = unit ? unit.number : 'Unit';
  const propertyAddress = unit && prop 
    ? `${unit.number}, ${unit.floor}, ${prop.name}, ${prop.address}, ${prop.city}, ${prop.state} - ${prop.pincode}`
    : 'Full Property Address';

  const newAgreement = {
    id: `agr_${Date.now()}`,
    agreementNumber: `AGR/IND/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
    propertyId,
    propertyName,
    unitId,
    unitNumber,
    propertyAddress,

    landlordName: landlordName || (currentUser ? currentUser.name : 'Rajesh Sharma'),
    landlordFatherName: landlordFatherName || 'Late O. P. Sharma',
    landlordAadhaar: landlordAadhaar || (currentUser ? currentUser.aadhaar : '9876-5432-1098'),
    landlordPan: landlordPan || (currentUser ? currentUser.pan : 'ABCPS1234F'),
    landlordPhone: landlordPhone || '+91 98765 43210',
    landlordAddress: landlordAddress || 'Koramangala, Bengaluru, Karnataka',

    tenantId,
    tenantName,
    tenantFatherName: tenantFatherName || 'Father / Guardian Name',
    tenantAadhaar,
    tenantPan: tenantPan || 'PAN Not Provided',
    tenantPhone,
    tenantEmail: tenantEmail || '',
    tenantPermanentAddress,

    termMonths: Number(termMonths),
    startDate,
    endDate,
    monthlyRent: Number(monthlyRent),
    monthlyRentInWords: monthlyRentInWords || `Rupees ${Number(monthlyRent).toLocaleString('en-IN')} Only`,
    securityDeposit: Number(securityDeposit),
    securityDepositInWords: securityDepositInWords || `Rupees ${Number(securityDeposit).toLocaleString('en-IN')} Only`,
    maintenanceCharges: Number(maintenanceCharges),
    rentDueDateDay: Number(rentDueDateDay),
    lockInPeriodMonths: Number(lockInPeriodMonths),
    noticePeriodMonths: Number(noticePeriodMonths),
    annualEscalationPercent: Number(annualEscalationPercent),

    electricityMeterNo,
    electricityConsumerId,
    waterMeterNo,
    waterConsumerId,

    stampCertificateNo,
    stampDutyAmount: Number(stampDutyAmount),
    stampIssueState,
    stampIssueDate: new Date().toISOString().split('T')[0],

    witness1Name,
    witness1Address,
    witness2Name,
    witness2Address,

    status: 'sent_to_tenant',
    landlordSigned: true,
    landlordSignedAt: new Date().toISOString(),
    tenantSigned: false,
    tenantSignedAt: null,
    notes
  };

  db.agreements.unshift(newAgreement);

  // Send notification to tenant
  if (tenantId) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: tenantId,
      title: 'New Rental Agreement Issued',
      message: `Landlord has issued the official rental agreement for ${unitNumber}. Please review and sign digitally.`,
      type: 'agreement_ready',
      severity: 'warning',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/agreements',
      actionText: 'Review Agreement'
    });
  }

  writeDb(db);
  res.status(201).json({ success: true, agreement: newAgreement });
});

// Digital signature endpoint (Tenant or Landlord signs)
app.post('/api/agreements/:id/sign', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);
  const agreement = db.agreements.find(a => a.id === req.params.id);

  if (!agreement) {
    return res.status(404).json({ success: false, message: 'Agreement not found' });
  }

  const { signatureData, signRole } = req.body;
  const now = new Date().toISOString();

  if (signRole === 'tenant' || (currentUser && currentUser.role === 'tenant')) {
    agreement.tenantSigned = true;
    agreement.tenantSignedAt = now;
    agreement.tenantSignatureData = signatureData || 'DIGITALLY_SIGNED_AADHAAR_OTP';
    if (agreement.landlordSigned) {
      agreement.status = 'executed';
    } else {
      agreement.status = 'signed_by_tenant';
    }

    // Notify landlord
    const adminUser = db.users.find(u => u.role === 'admin');
    if (adminUser) {
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: adminUser.id,
        title: 'Rental Agreement Signed',
        message: `${agreement.tenantName} has digitally signed the rental agreement for ${agreement.unitNumber}.`,
        type: 'agreement_signed',
        severity: 'success',
        read: false,
        createdAt: now,
        actionUrl: '/agreements',
        actionText: 'View Executed Agreement'
      });
    }
  } else {
    agreement.landlordSigned = true;
    agreement.landlordSignedAt = now;
    if (agreement.tenantSigned) {
      agreement.status = 'executed';
    }
  }

  writeDb(db);
  res.json({ success: true, agreement, message: 'Agreement signed successfully' });
});

/* ========================================================
   DAMAGES & INVOICES REPORTING
   ======================================================== */
app.get('/api/damages', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  let damages = db.damages;
  if (currentUser && currentUser.role === 'tenant') {
    damages = damages.filter(d => d.tenantId === userId);
  }

  res.json({ success: true, damages });
});

// Tenant adds new damage report with invoice & repair cost
app.post('/api/damages', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId) || db.users.find(u => u.role === 'tenant');

  const {
    title,
    category = 'Plumbing',
    severity = 'Medium',
    incidentDate,
    description,
    repairCost,
    costPayer = 'landlord',
    invoiceNumber,
    vendorName,
    vendorGstin,
    invoiceDate,
    invoiceFileUrl,
    invoiceFileName,
    photos = []
  } = req.body;

  const newDamage = {
    id: `dmg_${Date.now()}`,
    tenantId: currentUser.id,
    tenantName: currentUser.name,
    unitId: currentUser.assignedUnitId || 'unit_general',
    unitNumber: currentUser.unitNumber || 'Assigned Unit',
    title,
    category,
    severity,
    incidentDate: incidentDate || new Date().toISOString().split('T')[0],
    reportedDate: new Date().toISOString().split('T')[0],
    description,
    repairCost: Number(repairCost) || 0,
    costPayer,
    status: 'under_review',
    invoice: invoiceNumber || invoiceFileUrl ? {
      invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      vendorName: vendorName || 'Local Repair Services',
      vendorGstin: vendorGstin || 'Not Registered',
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      amount: Number(repairCost) || 0,
      fileUrl: invoiceFileUrl || null,
      fileName: invoiceFileName || 'repair_bill.pdf',
      fileSize: '320 KB'
    } : null,
    photos: photos.length > 0 ? photos : [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
    ],
    adminReview: {
      reviewedBy: null,
      reviewedAt: null,
      decision: null,
      notes: 'Submitted by tenant. Awaiting landlord inspection.'
    }
  };

  db.damages.unshift(newDamage);

  // Notify admin
  const adminUser = db.users.find(u => u.role === 'admin');
  if (adminUser) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: adminUser.id,
      title: 'New Damage & Repair Claim',
      message: `${currentUser.name} reported: "${title}" (Cost: ₹${Number(repairCost).toLocaleString('en-IN')}) with invoice.`,
      type: 'damage_claim',
      severity: 'warning',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/damages',
      actionText: 'Review Invoice'
    });
  }

  writeDb(db);
  res.status(201).json({ success: true, damage: newDamage });
});

// Admin reviews damage report (Approve, Reject, Reimburse, Deduct)
app.post('/api/damages/:id/review', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  if (currentUser && currentUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admin can review damage claims.' });
  }

  const damage = db.damages.find(d => d.id === req.params.id);
  if (!damage) {
    return res.status(404).json({ success: false, message: 'Damage record not found' });
  }

  const { status, notes, transactionRef } = req.body;
  const now = new Date().toISOString();

  damage.status = status; // approved, rejected, reimbursed, deducted_from_deposit
  damage.adminReview = {
    reviewedBy: currentUser ? currentUser.name : 'Rajesh Sharma',
    reviewedAt: now,
    decision: status.toUpperCase().replace(/_/g, ' '),
    notes: notes || 'Reviewed by Landlord.',
    reimbursedAt: status === 'reimbursed' ? now : null,
    transactionRef: transactionRef || (status === 'reimbursed' ? `UPI/${Date.now()}/ADMIN` : null)
  };

  // Notify tenant of the decision
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: damage.tenantId,
    title: `Damage Claim Update: ${damage.title}`,
    message: `Landlord has set your claim status to: ${status.toUpperCase().replace(/_/g, ' ')}. Note: ${notes || 'No extra note provided.'}`,
    type: 'damage_update',
    severity: status === 'approved' || status === 'reimbursed' ? 'success' : 'warning',
    read: false,
    createdAt: now,
    actionUrl: '/damages',
    actionText: 'View Details'
  });

  writeDb(db);
  res.json({ success: true, damage, message: 'Damage claim updated successfully' });
});

/* ========================================================
   RENT PAYMENTS & MONTHLY NOTIFICATIONS
   ======================================================== */
app.get('/api/rent/invoices', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  let invoices = db.rentInvoices;
  if (currentUser && currentUser.role === 'tenant') {
    invoices = invoices.filter(inv => inv.tenantId === userId);
  }

  res.json({ success: true, invoices });
});

// Tenant pays rent
app.post('/api/rent/pay', (req, res) => {
  const db = readDb();
  const { invoiceId, paymentMethod = 'UPI (Google Pay)', transactionRef } = req.body;

  const invoice = db.rentInvoices.find(inv => inv.id === invoiceId);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Rent invoice not found' });
  }

  const now = new Date().toISOString();
  invoice.status = 'paid';
  invoice.paidAt = now;
  invoice.paymentMethod = paymentMethod;
  invoice.transactionRef = transactionRef || `UPI/${Date.now()}/VERIFIED`;
  invoice.receiptNumber = `RCT-${invoice.billingMonth.replace(' ', '-').toUpperCase()}-${invoice.unitNumber.replace(/\D/g, '') || '01'}`;

  // Notify Landlord
  const adminUser = db.users.find(u => u.role === 'admin');
  if (adminUser) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: adminUser.id,
      title: 'Rent Payment Received',
      message: `${invoice.tenantName} paid rent of ₹${invoice.totalAmount.toLocaleString('en-IN')} for ${invoice.billingMonth} via ${paymentMethod}.`,
      type: 'rent_paid',
      severity: 'success',
      read: false,
      createdAt: now,
      actionUrl: '/payments',
      actionText: 'View Transaction'
    });
  }

  // Confirmation notification for Tenant
  db.notifications.unshift({
    id: `notif_${Date.now() + 1}`,
    userId: invoice.tenantId,
    title: 'Rent Payment Confirmed & Receipt Ready',
    message: `Thank you! Payment of ₹${invoice.totalAmount.toLocaleString('en-IN')} for ${invoice.billingMonth} received successfully. Receipt #${invoice.receiptNumber} generated.`,
    type: 'payment_success',
    severity: 'success',
    read: false,
    createdAt: now,
    actionUrl: '/payments',
    actionText: 'Download HRA Receipt'
  });

  writeDb(db);
  res.json({ success: true, invoice, message: 'Rent paid successfully! Official receipt generated.' });
});

// Admin broadcasts or sends rent due reminders to tenants
app.post('/api/rent/send-reminders', (req, res) => {
  const db = readDb();
  const { tenantId, month = 'November 2026', customMessage } = req.body;

  const unpaidInvoices = db.rentInvoices.filter(inv => 
    inv.status === 'unpaid' && (!tenantId || inv.tenantId === tenantId)
  );

  let sentCount = 0;
  const now = new Date().toISOString();

  unpaidInvoices.forEach(inv => {
    db.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random()}`,
      userId: inv.tenantId,
      title: `Rent Due Reminder: ${inv.billingMonth}`,
      message: customMessage || `Friendly reminder: Your rent of ₹${inv.totalAmount.toLocaleString('en-IN')} for ${inv.billingMonth} is due on ${inv.dueDate}. Please make the payment to avoid late charges.`,
      type: 'rent_due',
      severity: 'warning',
      read: false,
      createdAt: now,
      actionUrl: '/payments',
      actionText: 'Pay Rent Now'
    });
    sentCount++;
  });

  writeDb(db);
  res.json({ success: true, count: sentCount, message: `Sent rent payment reminder notifications to ${sentCount} tenant(s).` });
});

/* ========================================================
   GOVERNMENT METERS & UTILITY BILLS (Electricity & Water)
   ======================================================== */
// Get all registered meters
app.get('/api/utilities/meters', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  let meters = db.meters;
  if (currentUser && currentUser.role === 'tenant') {
    meters = meters.filter(m => m.tenantId === userId);
  }

  res.json({ success: true, meters });
});

// Register new government meter (Electricity or Water)
app.post('/api/utilities/meters', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  const {
    meterType, // electricity or water
    utilityProvider, // BESCOM, BSES, BWSSB, DJB, etc.
    consumerId, // CA number, RR number, consumer ID
    meterNumber,
    sanctionedLoad,
    phaseType = 'Single Phase Domestic',
    initialReading = 0,
    unitId,
    tenantId,
    governmentDocumentRef = ''
  } = req.body;

  // Resolve tenant and unit details
  const targetTenantId = tenantId || (currentUser?.role === 'tenant' ? currentUser.id : 'usr_tenant_1');
  const targetTenant = db.users.find(u => u.id === targetTenantId);
  const targetUnitId = unitId || targetTenant?.assignedUnitId || 'unit_302';

  const newMeter = {
    id: `meter_${Date.now()}`,
    unitId: targetUnitId,
    tenantId: targetTenantId,
    tenantName: targetTenant ? targetTenant.name : 'Resident',
    propertyId: targetTenant ? targetTenant.propertyId : 'prop_1',
    propertyName: targetTenant ? targetTenant.propertyName : 'Palm Heights',
    unitNumber: targetTenant ? targetTenant.unitNumber : 'Flat 302',
    meterType: meterType.toLowerCase(),
    utilityProvider,
    consumerId,
    meterNumber,
    sanctionedLoad: sanctionedLoad || (meterType === 'electricity' ? '3 kW' : 'Domestic 1/2"'),
    phaseType,
    registrationDate: new Date().toISOString().split('T')[0],
    initialReading: Number(initialReading),
    currentReading: Number(initialReading),
    status: 'active',
    governmentDocumentRef: governmentDocumentRef || `GOV-MTR-${Date.now().toString().slice(-6)}`
  };

  db.meters.push(newMeter);

  // Notification
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: targetTenantId,
    title: `Government ${meterType === 'electricity' ? 'Electricity' : 'Water'} Meter Registered`,
    message: `${utilityProvider} meter (No: ${meterNumber}, Consumer ID: ${consumerId}) successfully registered for ${newMeter.unitNumber}.`,
    type: 'meter_registered',
    severity: 'success',
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/utilities',
    actionText: 'View Meter'
  });

  writeDb(db);
  res.status(201).json({ success: true, meter: newMeter });
});

// Get utility bills (History, Paid/Unpaid)
app.get('/api/utilities/bills', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  let bills = db.utilityBills;
  if (currentUser && currentUser.role === 'tenant') {
    bills = bills.filter(b => b.tenantId === userId);
  }

  res.json({ success: true, bills });
});

// Add monthly meter reading & bill
app.post('/api/utilities/bills', (req, res) => {
  const db = readDb();
  const {
    meterId,
    billingMonth,
    currentReading,
    ratePerUnit = 7.5,
    fixedCharges = 120,
    dueDate,
    notes
  } = req.body;

  const meter = db.meters.find(m => m.id === meterId);
  if (!meter) {
    return res.status(404).json({ success: false, message: 'Meter not found' });
  }

  const prevReading = meter.currentReading || meter.initialReading || 0;
  const currReading = Number(currentReading);
  const unitsConsumed = Math.max(0, currReading - prevReading);
  const amount = Math.round(unitsConsumed * Number(ratePerUnit) + Number(fixedCharges));

  // Update meter's current reading
  meter.currentReading = currReading;

  const newBill = {
    id: `ubill_${Date.now()}`,
    meterId: meter.id,
    tenantId: meter.tenantId,
    unitId: meter.unitId,
    meterType: meter.meterType,
    provider: meter.utilityProvider.split(' ')[0],
    consumerId: meter.consumerId,
    billingMonth: billingMonth || 'November 2026',
    previousReading: prevReading,
    currentReading: currReading,
    unitsConsumed,
    ratePerUnit: Number(ratePerUnit),
    fixedCharges: Number(fixedCharges),
    amount,
    billDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    status: 'unpaid',
    paidAt: null,
    paymentRef: null,
    notes: notes || `Recorded monthly reading for ${meter.meterType}.`
  };

  db.utilityBills.unshift(newBill);

  // Notify tenant
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: meter.tenantId,
    title: `New ${meter.meterType.toUpperCase()} Bill: ${billingMonth || 'Current Month'}`,
    message: `Bill amount of ₹${amount.toLocaleString('en-IN')} (${unitsConsumed} units) is ready. Due by ${newBill.dueDate}.`,
    type: 'utility_bill',
    severity: 'warning',
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/utilities',
    actionText: 'Pay Bill'
  });

  writeDb(db);
  res.status(201).json({ success: true, bill: newBill, meter });
});

// Pay utility bill
app.post('/api/utilities/bills/:id/pay', (req, res) => {
  const db = readDb();
  const { paymentRef = `BBPS/UPI/${Date.now()}` } = req.body;

  const bill = db.utilityBills.find(b => b.id === req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, message: 'Utility bill not found' });
  }

  const now = new Date().toISOString();
  bill.status = 'paid';
  bill.paidAt = now;
  bill.paymentRef = paymentRef;

  // Confirmation notification
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: bill.tenantId,
    title: `${bill.meterType.toUpperCase()} Bill Paid Successfully`,
    message: `Payment of ₹${bill.amount.toLocaleString('en-IN')} for ${bill.billingMonth} confirmed. Reference: ${paymentRef}`,
    type: 'utility_paid',
    severity: 'success',
    read: false,
    createdAt: now,
    actionUrl: '/utilities',
    actionText: 'View Bill History'
  });

  writeDb(db);
  res.json({ success: true, bill, message: 'Bill paid successfully!' });
});

/* ========================================================
   NOTIFICATIONS
   ======================================================== */
app.get('/api/notifications', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const userNotifs = db.notifications.filter(n => n.userId === userId);
  res.json({ success: true, notifications: userNotifs });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const db = readDb();
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    writeDb(db);
  }
  res.json({ success: true });
});

app.put('/api/notifications/read-all', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  db.notifications.forEach(n => {
    if (n.userId === userId) {
      n.read = true;
    }
  });
  writeDb(db);
  res.json({ success: true });
});

/* ========================================================
   FILE UPLOADS (Invoice PDF/Images, Damage photos)
   ======================================================== */
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    fileName: req.file.originalname,
    fileSize: `${(req.file.size / 1024).toFixed(1)} KB`
  });
});

/* ========================================================
   RESET DATABASE (Optional utility for demo/testing)
   ======================================================== */
app.post('/api/reset-data', (req, res) => {
  const fresh = resetDb();
  res.json({ success: true, message: 'Database reset to initial demo seed state.', data: fresh });
});

// SPA Fallback for Client Routing
if (fs.existsSync(clientDist)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/sample-invoices')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  KirayaSetu Backend Server running on port ${PORT}`);
  console.log(`  Open in browser: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[PORT CONFLICT] Port ${PORT} is already in use by another running instance.`);
    console.error(`To clear port ${PORT} in PowerShell, run:`);
    console.error(`Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
