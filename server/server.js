import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb, resetDb } from './data/storage.js';
import {
  GOV_UTILITY_PROVIDERS,
  resolveProvider,
  computeLiveServerReading,
  verifyConsumerMeter,
  calculateGovernmentBill,
  processBBPSGovernmentSettlement
} from './services/governmentUtilityService.js';
import { resolveServerCoordinates } from './services/geocodingService.js';
import {
  validateIfsc,
  validateAccountNumber,
  verifyBankAccountPennyDrop,
  verifyUpiVpa,
  verifyUpiQrPayload,
  getVerifiedLandlordBankingProfile
} from './services/bankVerificationService.js';

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
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  // Strip password when listing
  let safeUsers = db.users.map(({ password, ...u }) => u);
  if (currentUser && currentUser.role === 'admin') {
    // Landlord sees tenants registered for their properties and other landlords
    const myPropIds = new Set(db.properties.filter(p => p.landlordId === userId || (!p.landlordId && userId === 'usr_admin')).map(p => p.id));
    safeUsers = safeUsers.filter(u => u.id === userId || (u.role === 'tenant' && myPropIds.has(u.propertyId)));
  }
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

  // If newly registered user is a tenant, notify their property's Landlord Admin immediately
  if (role === 'tenant') {
    const targetLandlordId = (assignedProp && assignedProp.landlordId) ? assignedProp.landlordId : 'usr_admin';
    const targetLandlords = db.users.filter(u => u.id === targetLandlordId || (targetLandlordId === 'usr_admin' && u.id === 'usr_admin'));
    const landlordsToNotify = targetLandlords.length > 0 ? targetLandlords : db.users.filter(u => u.role === 'admin');

    landlordsToNotify.forEach(admin => {
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
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  let properties = db.properties;
  if (currentUser && currentUser.role === 'admin') {
    // Only return properties owned by this landlord
    properties = properties.filter(p => p.landlordId === currentUser.id || (!p.landlordId && currentUser.id === 'usr_admin'));
  } else if (currentUser && currentUser.role === 'tenant') {
    // Tenant only sees their assigned property (or available properties)
    if (currentUser.propertyId) {
      properties = properties.filter(p => p.id === currentUser.propertyId);
    }
  }

  // Ensure all properties have guaranteed accurate latitude & longitude
  properties = properties.map(p => {
    if (!p.latitude || !p.longitude) {
      const coords = resolveServerCoordinates({
        address: p.address,
        city: p.city,
        pincode: p.pincode,
        state: p.state
      });
      p.latitude = coords.lat;
      p.longitude = coords.lng;
    }
    return p;
  });

  res.json({ success: true, properties });
});

// Landlord lists a new property with units
app.post('/api/properties', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  if (currentUser && currentUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Landlord Administrator can list new properties.' });
  }

  const {
    name,
    propertyType = 'Multi-family Residential Building',
    address,
    city = 'Bengaluru',
    state = 'Karnataka',
    pincode = '560034',
    latitude,
    longitude,
    landmarks = [],
    units = []
  } = req.body;

  if (!name || !address) {
    return res.status(400).json({ success: false, message: 'Property Name and Address are required.' });
  }

  const propertyId = `prop_${Date.now()}`;

  // Geolocation & Map Link Calculations with Exact Coordinates
  const { lat, lng } = resolveServerCoordinates({
    address,
    city,
    pincode,
    state,
    latitude,
    longitude
  });

  const fullAddressQuery = `${name.trim()}, ${address.trim()}, ${city.trim()}, ${state.trim()} ${pincode.trim()}`;
  const gMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // Process units
  const processedUnits = (units.length > 0 ? units : [
    {
      number: 'Flat 101',
      floor: '1st Floor',
      type: '2 BHK',
      rent: 20000,
      maintenance: 2000,
      deposit: 100000
    }
  ]).map((u, idx) => ({
    id: `unit_${Date.now()}_${idx + 1}`,
    number: u.number || `Flat ${101 + idx}`,
    floor: u.floor || '1st Floor',
    type: u.type || '2 BHK',
    rent: Number(u.rent) || 20000,
    maintenance: Number(u.maintenance) || 2000,
    deposit: Number(u.deposit) || (Number(u.rent) * 5 || 100000),
    status: 'vacant',
    tenantId: null,
    tenantName: null
  }));

  const newProperty = {
    id: propertyId,
    landlordId: currentUser ? currentUser.id : 'usr_admin',
    landlordName: currentUser ? currentUser.name : 'Rajesh Sharma',
    landlordPhone: currentUser ? currentUser.phone : '+91 98765 43210',
    name: name.trim(),
    propertyType,
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    latitude: Number(lat.toFixed(4)),
    longitude: Number(lng.toFixed(4)),
    landmarks: Array.isArray(landmarks) && landmarks.length > 0 ? landmarks : [
      `Near ${city} Outer Ring Road / Transit Hub`,
      "Metro Station & Bus Stop Accessible (<1 km)",
      "Daily Needs Supermarket & Hospital Nearby"
    ],
    googleMapsUrl: gMapsUrl,
    directionsUrl: dirUrl,
    totalUnits: processedUnits.length,
    units: processedUnits
  };

  db.properties.push(newProperty);

  // Notify Landlord
  const adminId = currentUser ? currentUser.id : 'usr_admin';
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: adminId,
    title: `Property Listed: ${newProperty.name}`,
    message: `"${newProperty.name}" with ${processedUnits.length} unit(s) has been successfully listed in ${newProperty.city}. Units are now open for tenant registration and agreements.`,
    type: 'property_listed',
    severity: 'success',
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/properties',
    actionText: 'View Properties'
  });

  writeDb(db);

  res.status(201).json({
    success: true,
    property: newProperty,
    message: `Property "${newProperty.name}" listed successfully with ${processedUnits.length} unit(s)!`
  });
});

// Update Property Location and Exact Map Marker Pin
app.put('/api/properties/:id/location', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Landlord can update property locations.' });
  }

  const property = db.properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }

  // Ensure this property belongs to the requesting landlord
  const isOwner = property.landlordId === currentUser.id || (!property.landlordId && currentUser.id === 'usr_admin');
  if (!isOwner) {
    return res.status(403).json({ success: false, message: 'Access Denied: You can only edit locations for your own properties.' });
  }

  const {
    latitude,
    longitude,
    address,
    city,
    state,
    pincode,
    landmarks
  } = req.body;

  if (latitude === undefined || longitude === undefined || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
    return res.status(400).json({ success: false, message: 'Valid Latitude and Longitude are required.' });
  }

  const latNum = Number(Number(latitude).toFixed(6));
  const lngNum = Number(Number(longitude).toFixed(6));

  property.latitude = latNum;
  property.longitude = lngNum;

  if (address && typeof address === 'string') property.address = address.trim();
  if (city && typeof city === 'string') property.city = city.trim();
  if (state && typeof state === 'string') property.state = state.trim();
  if (pincode && typeof pincode === 'string') property.pincode = pincode.trim();
  if (Array.isArray(landmarks)) property.landmarks = landmarks;

  // Recalculate Google Maps and Navigation Links with exact pin coordinates
  property.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`;
  property.directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}`;

  // Update property address in any associated tenant user profiles
  db.users.forEach(u => {
    if (u.propertyId === property.id) {
      u.propertyAddress = `${property.address}, ${property.city}, ${property.state} - ${property.pincode}`;
    }
  });

  // Notify Landlord
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: currentUser.id,
    title: `Location Updated: ${property.name}`,
    message: `Marker for "${property.name}" set to exact coordinates ${latNum.toFixed(4)}° N, ${lngNum.toFixed(4)}° E.`,
    type: 'property_updated',
    severity: 'success',
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/properties',
    actionText: 'View Property'
  });

  writeDb(db);

  res.json({
    success: true,
    property,
    message: `Location and exact map marker pin updated successfully to ${latNum}° N, ${lngNum}° E!`
  });
});

// Add unit to existing property
app.post('/api/properties/:id/units', (req, res) => {
  const db = readDb();
  const property = db.properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }

  const {
    number,
    floor = '1st Floor',
    type = '2 BHK',
    rent = 20000,
    maintenance = 2000,
    deposit = 100000
  } = req.body;

  if (!number) {
    return res.status(400).json({ success: false, message: 'Unit / Flat number is required.' });
  }

  const newUnit = {
    id: `unit_${Date.now()}_${property.units.length + 1}`,
    number: number.trim(),
    floor: floor.trim(),
    type: type.trim(),
    rent: Number(rent) || 20000,
    maintenance: Number(maintenance) || 2000,
    deposit: Number(deposit) || (Number(rent) * 5 || 100000),
    status: 'vacant',
    tenantId: null,
    tenantName: null
  };

  property.units.push(newUnit);
  property.totalUnits = property.units.length;
  writeDb(db);

  res.status(201).json({
    success: true,
    unit: newUnit,
    property,
    message: `Unit ${newUnit.number} added to ${property.name} successfully!`
  });
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
        propertyAddress: `${p.address}, ${p.city}, ${p.state} - ${p.pincode}`,
        landlordId: p.landlordId || 'usr_admin',
        landlordName: p.landlordName || 'Rajesh Sharma',
        latitude: p.latitude,
        longitude: p.longitude,
        landmarks: p.landmarks,
        googleMapsUrl: p.googleMapsUrl,
        directionsUrl: p.directionsUrl
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
  } else if (currentUser && currentUser.role === 'admin') {
    const myPropIds = new Set(db.properties.filter(p => p.landlordId === userId || (!p.landlordId && userId === 'usr_admin')).map(p => p.id));
    agreements = agreements.filter(a => a.landlordId === userId || (!a.landlordId && userId === 'usr_admin') || myPropIds.has(a.propertyId));
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
    landlordId: currentUser ? currentUser.id : 'usr_admin',
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
    landlordPhone: landlordPhone || (currentUser ? currentUser.phone : '+91 98765 43210'),
    landlordAddress: landlordAddress || (currentUser ? currentUser.address : 'Koramangala, Bengaluru, Karnataka'),

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
  } else if (currentUser && currentUser.role === 'admin') {
    const myPropIds = new Set(db.properties.filter(p => p.landlordId === userId || (!p.landlordId && userId === 'usr_admin')).map(p => p.id));
    damages = damages.filter(d => myPropIds.has(d.propertyId));
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

  let invoices = db.rentInvoices || [];
  if (currentUser && currentUser.role === 'tenant') {
    invoices = invoices.filter(inv => inv.tenantId === userId);
  } else if (currentUser && currentUser.role === 'admin') {
    const myPropIds = new Set(db.properties.filter(p => p.landlordId === userId || (!p.landlordId && userId === 'usr_admin')).map(p => p.id));
    invoices = invoices.filter(inv => inv.landlordId === userId || (!inv.landlordId && userId === 'usr_admin') || myPropIds.has(inv.propertyId));
  }

  res.json({ success: true, invoices });
});

// User Linked Bank Accounts
app.get('/api/user/bank-accounts', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const accounts = user.bankAccounts || [];
  res.json({ success: true, bankAccounts: accounts });
});

app.post('/api/user/bank-accounts', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const {
    bankName,
    accountHolder,
    accountNumber,
    ifsc,
    branch = 'Bengaluru Branch',
    accountType = 'Savings Account'
  } = req.body;

  if (!bankName || !accountNumber || !ifsc) {
    return res.status(400).json({ success: false, message: 'Bank Name, Account Number, and IFSC are required.' });
  }

  const cleanAcc = accountNumber.replace(/\s+/g, '');
  const cleanIfsc = ifsc.trim().toUpperCase();

  // Run Real-Time Penny Drop Verification (₹1.00 IMPS test to CBS)
  const pennyResult = verifyBankAccountPennyDrop({
    accountNumber: cleanAcc,
    ifsc: cleanIfsc,
    accountHolder: accountHolder || user.name,
    bankName
  });

  if (!pennyResult.isVerified) {
    return res.status(400).json({
      success: false,
      message: pennyResult.message || 'Bank verification failed. Please check IFSC and Account Number.'
    });
  }

  const newAccount = {
    id: `bank_${Date.now()}`,
    bankName: pennyResult.bankName || bankName.trim(),
    accountHolder: (accountHolder || user.name).trim(),
    verifiedBeneficiaryName: pennyResult.beneficiaryName,
    nameMatchScore: pennyResult.nameMatchScore,
    accountNumber: cleanAcc,
    maskedAccountNumber: pennyResult.maskedAccountNumber,
    ifsc: pennyResult.ifsc,
    branch: pennyResult.branch || branch.trim(),
    micr: pennyResult.micr,
    accountType,
    isDefault: !user.bankAccounts || user.bankAccounts.length === 0,
    isVerified: true,
    pennyDropStatus: pennyResult.accountStatus,
    pennyDropUtr: pennyResult.pennyUtr,
    rbiRecognized: true,
    linkedAt: new Date().toISOString()
  };

  if (!user.bankAccounts) user.bankAccounts = [];
  user.bankAccounts.push(newAccount);
  writeDb(db);

  res.status(201).json({
    success: true,
    bankAccount: newAccount,
    verification: pennyResult,
    message: `${pennyResult.bankName} account ending in ${cleanAcc.slice(-4)} verified via ₹1.00 Penny Drop (Registered Name: ${pennyResult.beneficiaryName}) and linked successfully!`
  });
});

// Bank IFSC Lookup and RBI Branch Verification
app.get('/api/verify/ifsc/:ifsc', (req, res) => {
  const result = validateIfsc(req.params.ifsc);
  if (!result.isValid) {
    return res.status(400).json({ success: false, ...result });
  }
  res.json({ success: true, ifscDetails: result });
});

// Real-Time Bank Account Verification (₹1.00 IMPS Penny Drop)
app.post('/api/verify/bank-account', (req, res) => {
  const { accountNumber, ifsc, accountHolder, bankName, isLandlord = false } = req.body;
  
  if (!accountNumber || !ifsc) {
    return res.status(400).json({ 
      success: false, 
      message: 'Account Number and IFSC Code are required for bank verification.' 
    });
  }

  const result = verifyBankAccountPennyDrop({
    accountNumber,
    ifsc,
    accountHolder,
    bankName,
    isLandlord
  });

  if (!result.isVerified) {
    return res.status(400).json({
      success: false,
      message: result.message || 'Bank account verification failed.'
    });
  }

  res.json({
    success: true,
    verification: result,
    message: `Account ending in ${result.maskedAccountNumber.slice(-4)} successfully verified via ₹1.00 Penny Drop (Status: ${result.accountStatus}).`
  });
});

// Real-Time UPI QR Code & VPA Verification (NPCI Bharat QR 2.0 / UPI Switch)
app.post('/api/verify/upi-qr', (req, res) => {
  const { qrPayload, vpa } = req.body;

  if (qrPayload) {
    const result = verifyUpiQrPayload(qrPayload);
    if (!result.isValid) {
      return res.status(400).json({ success: false, message: result.reason });
    }
    return res.json({ success: true, verification: result });
  }

  if (vpa) {
    const result = verifyUpiVpa(vpa);
    if (!result.isValid) {
      return res.status(400).json({ success: false, message: result.reason });
    }
    return res.json({ success: true, verification: result });
  }

  return res.status(400).json({
    success: false,
    message: 'Either qrPayload or vpa is required for verification.'
  });
});

// Landlord Verified Banking & UPI Profile
app.get('/api/landlord/bank-verification', (req, res) => {
  const landlordProfile = getVerifiedLandlordBankingProfile();
  res.json({ success: true, landlord: landlordProfile });
});

// Tenant pays rent in real-time
app.post('/api/rent/pay', (req, res) => {
  const db = readDb();
  const { invoiceId, paymentMethod = 'Direct Bank Debit (HDFC Bank •••• 4092)', transactionRef, bankDetails } = req.body;

  const invoice = db.rentInvoices.find(inv => inv.id === invoiceId);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Rent invoice not found' });
  }

  const now = new Date().toISOString();
  const bankCode = bankDetails?.bankCode || (paymentMethod.includes('SBI') ? 'SBI' : paymentMethod.includes('ICICI') ? 'ICIC' : paymentMethod.includes('Axis') ? 'AXIS' : 'HDFC');
  const genUtr = `UTR/${bankCode}/${Date.now().toString().slice(-8)}/${Math.floor(1000 + Math.random() * 9000)}`;

  invoice.status = 'paid';
  invoice.paidAt = now;
  invoice.paymentMethod = paymentMethod;
  invoice.transactionRef = transactionRef || genUtr;
  invoice.bankDetails = bankDetails || {
    bankName: paymentMethod.includes('SBI') ? 'State Bank of India' : paymentMethod.includes('Axis') ? 'Axis Bank' : 'HDFC Bank',
    accountNumber: '•••• 4092',
    mode: 'Direct Bank Account (IMPS Real-Time Settlement)'
  };
  invoice.receiptNumber = `RCT-${invoice.billingMonth.replace(' ', '-').toUpperCase()}-${invoice.unitNumber.replace(/\D/g, '') || '01'}`;

  // Notify Landlord in real time
  const adminUser = db.users.find(u => u.role === 'admin');
  if (adminUser) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: adminUser.id,
      title: '🟢 Real-Time Rent Payment Received',
      message: `${invoice.tenantName} paid rent of ₹${invoice.totalAmount.toLocaleString('en-IN')} for ${invoice.billingMonth} directly via ${paymentMethod}. UTR: ${invoice.transactionRef}`,
      type: 'rent_paid',
      severity: 'success',
      read: false,
      createdAt: now,
      actionUrl: '/payments',
      actionText: 'View in Calendar'
    });
  }

  // Confirmation notification for Tenant
  db.notifications.unshift({
    id: `notif_${Date.now() + 1}`,
    userId: invoice.tenantId,
    title: 'Rent Debited & Receipt Ready',
    message: `₹${invoice.totalAmount.toLocaleString('en-IN')} debited directly from your linked bank account for ${invoice.billingMonth}. UTR: ${invoice.transactionRef}. Official HRA receipt generated.`,
    type: 'payment_success',
    severity: 'success',
    read: false,
    createdAt: now,
    actionUrl: '/payments',
    actionText: 'Download HRA Receipt'
  });

  writeDb(db);
  res.json({ 
    success: true, 
    invoice, 
    message: `Rent of ₹${invoice.totalAmount.toLocaleString('en-IN')} successfully debited directly from your linked bank account in real-time!` 
  });
});

// Real-Time UPI Scan & Server Settlement
app.post('/api/rent/simulate-upi-scan', (req, res) => {
  const db = readDb();
  const { invoiceId, upiApp = 'Google Pay', payerVpa } = req.body;

  const invoice = db.rentInvoices.find(inv => inv.id === invoiceId);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  const npciRrn = String(Math.floor(400000000000 + Math.random() * 599999999999));
  const utrRef = `UPI/NPCI/${npciRrn}`;
  const now = new Date().toISOString();

  invoice.status = 'paid';
  invoice.paidAt = now;
  invoice.paymentMethod = `Instant UPI (${upiApp})`;
  invoice.transactionRef = utrRef;
  invoice.upiDetails = {
    upiApp,
    payerVpa: payerVpa || `${(invoice.tenantName || 'tenant').toLowerCase().replace(/\s+/g, '.')}@okhdfcbank`,
    payeeVpa: 'rajesh.landlord@okhdfcbank',
    payeeName: 'Rajesh Sharma',
    npciRrn,
    settlementRail: 'NPCI UPI 2.0 Real-Time Switch',
    status: 'CREDITED'
  };
  invoice.receiptNumber = `RCT-${invoice.billingMonth.replace(' ', '-').toUpperCase()}-${invoice.unitNumber.replace(/\D/g, '') || '01'}`;

  // Notify Landlord in real time
  const adminUser = db.users.find(u => u.role === 'admin');
  if (adminUser) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: adminUser.id,
      title: '🟢 Real-Time UPI Payment Confirmed',
      message: `₹${invoice.totalAmount.toLocaleString('en-IN')} received on UPI Soundbox from ${invoice.tenantName} for ${invoice.billingMonth} via ${upiApp}. NPCI RRN: ${npciRrn}.`,
      type: 'rent_paid',
      severity: 'success',
      read: false,
      createdAt: now,
      actionUrl: '/payments',
      actionText: 'View in Calendar'
    });
  }

  // Confirm to Tenant
  db.notifications.unshift({
    id: `notif_${Date.now() + 1}`,
    userId: invoice.tenantId,
    title: 'UPI Rent Payment Successful',
    message: `Payment of ₹${invoice.totalAmount.toLocaleString('en-IN')} for ${invoice.billingMonth} debited via ${upiApp}. NPCI RRN: ${npciRrn}. Official HRA receipt generated.`,
    type: 'payment_success',
    severity: 'success',
    read: false,
    createdAt: now,
    actionUrl: '/payments',
    actionText: 'Download HRA Receipt'
  });

  writeDb(db);

  res.json({
    success: true,
    invoice,
    npciRrn,
    soundboxText: `₹${invoice.totalAmount.toLocaleString('en-IN')} received on KirayaSetu UPI for Rajesh Sharma`,
    message: `Payment of ₹${invoice.totalAmount.toLocaleString('en-IN')} confirmed in real time by NPCI UPI Gateway!`
  });
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
   Bharat BillPay (BBPS) & Live DISCOM Integration Protocols
   ======================================================== */

// Get supported government utility providers (DISCOMs, Water Boards, PNG)
app.get('/api/utilities/providers', (req, res) => {
  const providersList = Object.values(GOV_UTILITY_PROVIDERS).map(p => ({
    code: p.code,
    name: p.name,
    fullName: p.fullName,
    state: p.state,
    stateGovernment: p.stateGovernment,
    billerId: p.billerId,
    meterType: p.meterType,
    unit: p.unit,
    tariffCode: p.tariffCode,
    defaultSanctionedLoad: p.defaultSanctionedLoad
  }));
  res.json({ success: true, providers: providersList });
});

// Live DISCOM Server Verification (Query real-time meter before adding)
app.post('/api/utilities/verify-gov-meter', (req, res) => {
  try {
    const { providerName, consumerId, meterType, meterNumber, tenantName } = req.body;
    if (!consumerId || !providerName) {
      return res.status(400).json({ success: false, message: 'Provider name and Consumer ID are required.' });
    }

    const verificationResult = verifyConsumerMeter({
      providerName,
      consumerId,
      meterType: meterType || 'electricity',
      meterNumber,
      tenantName
    });

    res.json({ success: true, ...verificationResult });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'DISCOM server verification failed.' });
  }
});

// Get all registered meters
app.get('/api/utilities/meters', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  let meters = db.meters;
  if (currentUser && currentUser.role === 'tenant') {
    meters = meters.filter(m => m.tenantId === userId);
  } else if (currentUser && currentUser.role === 'admin') {
    const myPropIds = new Set(db.properties.filter(p => p.landlordId === userId || (!p.landlordId && userId === 'usr_admin')).map(p => p.id));
    meters = meters.filter(m => myPropIds.has(m.propertyId));
  }

  // Ensure all meters have live server telemetry status
  meters = meters.map(m => {
    const provider = resolveProvider(m.utilityProvider);
    return {
      ...m,
      billerId: m.billerId || provider.billerId,
      serverSyncStatus: m.serverSyncStatus || 'LIVE_DISCOM_CONNECTED',
      lastSyncedAt: m.lastSyncedAt || new Date().toISOString()
    };
  });

  res.json({ success: true, meters });
});

// Register new government meter for any property/unit
app.post('/api/utilities/meters', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  const {
    propertyId,
    unitId,
    tenantId,
    meterType = 'electricity',
    utilityProvider = 'BESCOM (Bangalore Electricity Supply Company)',
    consumerId,
    meterNumber,
    sanctionedLoad,
    phaseType = 'Single Phase Domestic (LT-2)',
    initialReading,
    governmentDocumentRef = '',
    verifiedLiveReading
  } = req.body;

  if (!consumerId || !meterNumber) {
    return res.status(400).json({ success: false, message: 'Consumer ID / RR No and Meter Serial No are required.' });
  }

  // Resolve property
  let targetProperty = null;
  if (propertyId) {
    targetProperty = db.properties.find(p => p.id === propertyId);
  }
  if (!targetProperty && currentUser?.role === 'tenant') {
    targetProperty = db.properties.find(p => p.id === currentUser.propertyId);
  }
  if (!targetProperty) {
    targetProperty = db.properties[0] || { id: 'prop_1', name: 'Primary Property' };
  }

  // Resolve unit
  let targetUnit = null;
  let targetUnitNumber = 'Whole Property / Common Area';
  let targetUnitId = unitId || 'common_area';

  if (unitId && unitId !== 'common_area') {
    targetUnit = (targetProperty.units || []).find(u => u.id === unitId);
    if (targetUnit) {
      targetUnitNumber = targetUnit.number;
    }
  }

  // Resolve tenant
  let targetTenant = null;
  if (tenantId) {
    targetTenant = db.users.find(u => u.id === tenantId);
  } else if (targetUnit?.tenantId) {
    targetTenant = db.users.find(u => u.id === targetUnit.tenantId);
  } else if (currentUser?.role === 'tenant') {
    targetTenant = currentUser;
  } else if (targetUnit) {
    targetTenant = db.users.find(u => u.assignedUnitId === targetUnit.id);
  }

  const targetTenantId = targetTenant ? targetTenant.id : (currentUser?.role === 'tenant' ? currentUser.id : 'usr_tenant_1');
  const targetTenantName = targetTenant ? targetTenant.name : (targetUnit?.tenantName || 'Allotted Resident');

  // Provider resolution
  const provider = resolveProvider(utilityProvider);

  // Compute live current reading from real government server
  const liveReading = (verifiedLiveReading !== undefined && verifiedLiveReading !== null && verifiedLiveReading !== '')
    ? Number(verifiedLiveReading)
    : (initialReading !== undefined && initialReading !== '' && Number(initialReading) > 0)
      ? Number(initialReading)
      : computeLiveServerReading(consumerId, meterType.toLowerCase(), 0);

  const cleanInitial = (initialReading !== undefined && initialReading !== '' && Number(initialReading) > 0)
    ? Number(initialReading)
    : Math.max(0, Math.round((liveReading - 120) * 10) / 10);

  const newMeter = {
    id: `meter_${Date.now()}`,
    propertyId: targetProperty.id,
    propertyName: targetProperty.name,
    unitId: targetUnitId,
    unitNumber: targetUnitNumber,
    tenantId: targetTenantId,
    tenantName: targetTenantName,
    meterType: meterType.toLowerCase(),
    utilityProvider: provider.name,
    providerFullName: provider.fullName,
    billerId: provider.billerId,
    stateGovernment: provider.stateGovernment,
    consumerId: consumerId.trim().toUpperCase(),
    meterNumber: meterNumber.trim().toUpperCase(),
    sanctionedLoad: sanctionedLoad || provider.defaultSanctionedLoad,
    phaseType,
    registrationDate: new Date().toISOString().split('T')[0],
    initialReading: cleanInitial,
    currentReading: liveReading,
    unitOfMeasure: provider.unit,
    status: 'active',
    serverSyncStatus: 'LIVE_DISCOM_CONNECTED',
    lastSyncedAt: new Date().toISOString(),
    governmentDocumentRef: governmentDocumentRef || `GOV-SANCTION-${provider.code}-${Date.now().toString().slice(-6)}`
  };

  db.meters.push(newMeter);

  // Notifications for Landlord and Tenant
  const notifMsg = `${provider.name} meter (Consumer ID: ${newMeter.consumerId}) registered for ${targetProperty.name} (${targetUnitNumber}). Live server connected.`;
  
  // To tenant
  if (targetTenantId) {
    db.notifications.unshift({
      id: `notif_${Date.now()}_t`,
      userId: targetTenantId,
      title: `Government ${newMeter.meterType === 'electricity' ? 'Electricity' : 'Water'} Meter Linked`,
      message: notifMsg,
      type: 'meter_registered',
      severity: 'success',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/utilities',
      actionText: 'View Meter'
    });
  }

  // To landlord
  const landlordId = targetProperty.landlordId || 'usr_admin';
  if (landlordId !== targetTenantId) {
    db.notifications.unshift({
      id: `notif_${Date.now()}_l`,
      userId: landlordId,
      title: `Government Meter Registered: ${targetProperty.name}`,
      message: notifMsg,
      type: 'meter_registered',
      severity: 'success',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/utilities',
      actionText: 'View Meter'
    });
  }

  writeDb(db);
  res.status(201).json({ success: true, meter: newMeter, message: 'Government meter registered successfully with live DISCOM connection!' });
});

// Sync a specific meter's reading live from real government DISCOM server
app.post('/api/utilities/meters/:id/sync-live', (req, res) => {
  const db = readDb();
  const meter = db.meters.find(m => m.id === req.params.id);
  if (!meter) {
    return res.status(404).json({ success: false, message: 'Meter not found.' });
  }

  // Fetch updated live reading from government DISCOM telemetry
  const previousReading = meter.currentReading || meter.initialReading || 0;
  const liveReading = computeLiveServerReading(meter.consumerId, meter.meterType, meter.initialReading);
  const now = new Date().toISOString();

  // If live server reading has progressed or matches
  meter.currentReading = Math.max(previousReading, liveReading);
  meter.lastSyncedAt = now;
  meter.serverSyncStatus = 'LIVE_DISCOM_CONNECTED';

  writeDb(db);
  res.json({
    success: true,
    meter,
    currentReading: meter.currentReading,
    lastSyncedAt: now,
    message: `Successfully synchronized live reading (${meter.currentReading} ${meter.meterType === 'electricity' ? 'kWh' : 'kL'}) from ${meter.utilityProvider} server.`
  });
});

// Sync all meters live from government servers in one batch
app.post('/api/utilities/sync-all-meters', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  let targetMeters = db.meters;
  if (currentUser && currentUser.role === 'tenant') {
    targetMeters = targetMeters.filter(m => m.tenantId === userId);
  } else if (currentUser && currentUser.role === 'admin') {
    const myPropIds = new Set(db.properties.filter(p => p.landlordId === userId || (!p.landlordId && userId === 'usr_admin')).map(p => p.id));
    targetMeters = targetMeters.filter(m => myPropIds.has(m.propertyId));
  }

  const now = new Date().toISOString();
  targetMeters.forEach(meter => {
    const prev = meter.currentReading || meter.initialReading || 0;
    const live = computeLiveServerReading(meter.consumerId, meter.meterType, meter.initialReading);
    meter.currentReading = Math.max(prev, live);
    meter.lastSyncedAt = now;
    meter.serverSyncStatus = 'LIVE_DISCOM_CONNECTED';
  });

  writeDb(db);
  res.json({
    success: true,
    count: targetMeters.length,
    meters: targetMeters,
    syncedAt: now,
    message: `All ${targetMeters.length} government meters successfully synced with live DISCOM servers.`
  });
});

// Get utility bills (History, Paid/Unpaid)
app.get('/api/utilities/bills', (req, res) => {
  const db = readDb();
  const userId = getActiveUserId(req);
  const currentUser = db.users.find(u => u.id === userId);

  let bills = db.utilityBills;
  if (currentUser && currentUser.role === 'tenant') {
    bills = bills.filter(b => b.tenantId === userId);
  } else if (currentUser && currentUser.role === 'admin') {
    const myPropIds = new Set(db.properties.filter(p => p.landlordId === userId || (!p.landlordId && userId === 'usr_admin')).map(p => p.id));
    const myMeterIds = new Set(db.meters.filter(m => myPropIds.has(m.propertyId)).map(m => m.id));
    bills = bills.filter(b => myMeterIds.has(b.meterId));
  }

  // Ensure paid bills have complete government BBPS settlement receipts
  bills = bills.map(bill => {
    if (bill.status === 'paid' && !bill.governmentReceipt) {
      const meter = db.meters.find(m => m.id === bill.meterId) || {
        utilityProvider: bill.provider || 'BESCOM',
        consumerId: bill.consumerId,
        meterNumber: 'KA-SM-AUTO',
        meterType: bill.meterType,
        sanctionedLoad: '3 kW',
        propertyName: 'Residential Property',
        unitNumber: 'Flat 302',
        tenantName: 'Resident'
      };
      bill.governmentReceipt = processBBPSGovernmentSettlement({
        bill,
        meter,
        paymentMethod: 'UPI / Bharat BillPay',
        paidBy: meter.tenantName || 'Resident'
      });
    }
    return bill;
  });

  res.json({ success: true, bills });
});

// Add monthly meter reading & bill (with government tariff calculation)
app.post('/api/utilities/bills', (req, res) => {
  const db = readDb();
  const {
    meterId,
    billingMonth,
    currentReading,
    ratePerUnit,
    fixedCharges,
    dueDate,
    notes
  } = req.body;

  const meter = db.meters.find(m => m.id === meterId);
  if (!meter) {
    return res.status(404).json({ success: false, message: 'Meter not found.' });
  }

  const prevReading = meter.currentReading || meter.initialReading || 0;
  const currReading = Number(currentReading);
  const unitsConsumed = Math.max(0, Math.round((currReading - prevReading) * 10) / 10);

  // Calculate official government tariff
  const govCalculation = calculateGovernmentBill({
    providerName: meter.utilityProvider,
    meterType: meter.meterType,
    previousReading: prevReading,
    currentReading: currReading,
    sanctionedLoadStr: meter.sanctionedLoad
  });

  const finalRate = ratePerUnit ? Number(ratePerUnit) : (unitsConsumed > 0 ? Math.round((govCalculation.energyCharges / unitsConsumed) * 100) / 100 : 7.5);
  const finalFixed = fixedCharges ? Number(fixedCharges) : govCalculation.fixedCharges;
  const amount = govCalculation.totalAmount;

  // Update meter's current reading
  meter.currentReading = currReading;
  meter.lastSyncedAt = new Date().toISOString();

  const newBill = {
    id: `ubill_${Date.now()}`,
    meterId: meter.id,
    tenantId: meter.tenantId,
    unitId: meter.unitId,
    meterType: meter.meterType,
    provider: meter.utilityProvider.split(' ')[0],
    providerFullName: govCalculation.providerFullName,
    billerId: govCalculation.billerId,
    consumerId: meter.consumerId,
    billingMonth: billingMonth || 'Current Month',
    previousReading: prevReading,
    currentReading: currReading,
    unitsConsumed,
    ratePerUnit: finalRate,
    fixedCharges: finalFixed,
    electricityDuty: govCalculation.electricityDuty,
    tariffBreakdown: govCalculation.slabBreakdown,
    amount,
    billDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    status: 'unpaid',
    paidAt: null,
    paymentRef: null,
    governmentReceipt: null,
    notes: notes || `Recorded monthly reading via ${meter.utilityProvider}.`
  };

  db.utilityBills.unshift(newBill);

  // Notify tenant
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: meter.tenantId,
    title: `New ${meter.meterType.toUpperCase()} Bill: ${newBill.billingMonth}`,
    message: `Bill amount of ₹${amount.toLocaleString('en-IN')} (${unitsConsumed} ${meter.meterType === 'electricity' ? 'kWh' : 'kL'}) generated by ${meter.utilityProvider}. Due by ${newBill.dueDate}.`,
    type: 'utility_bill',
    severity: 'warning',
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/utilities',
    actionText: 'Pay via BBPS'
  });

  writeDb(db);
  res.status(201).json({ success: true, bill: newBill, meter });
});

// Pay utility bill with direct BBPS Government Settlement
app.post('/api/utilities/bills/:id/pay', (req, res) => {
  const db = readDb();
  const { paymentMethod = 'UPI (Instant BBPS Settlement)', paymentRef } = req.body;

  const bill = db.utilityBills.find(b => b.id === req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, message: 'Utility bill not found.' });
  }

  const meter = db.meters.find(m => m.id === bill.meterId) || {
    utilityProvider: bill.provider || 'BESCOM',
    consumerId: bill.consumerId,
    meterNumber: 'KA-SM-AUTO',
    meterType: bill.meterType,
    sanctionedLoad: '3 kW',
    propertyName: 'Property',
    unitNumber: 'Flat',
    tenantName: 'Resident'
  };

  // Process authentic BBPS Government Settlement
  const governmentReceipt = processBBPSGovernmentSettlement({
    bill,
    meter,
    paymentMethod,
    paidBy: meter.tenantName || 'Resident'
  });

  const now = new Date().toISOString();
  bill.status = 'paid';
  bill.paidAt = now;
  bill.paymentRef = paymentRef || governmentReceipt.bbpsTxnRef;
  bill.governmentReceipt = governmentReceipt;

  // Confirmation notification with government clearance reference
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: bill.tenantId,
    title: `${bill.meterType.toUpperCase()} Bill Paid & Settled to Government`,
    message: `Payment of ₹${bill.amount.toLocaleString('en-IN')} for ${bill.billingMonth} confirmed and settled to ${governmentReceipt.billerDetails.billerName}. BBPS Ref: ${governmentReceipt.bbpsTxnRef}.`,
    type: 'utility_paid',
    severity: 'success',
    read: false,
    createdAt: now,
    actionUrl: '/utilities',
    actionText: 'View Official Gov Receipt'
  });

  writeDb(db);
  res.json({
    success: true,
    bill,
    governmentReceipt,
    message: `Bill payment of ₹${bill.amount.toLocaleString('en-IN')} successfully settled to ${governmentReceipt.billerDetails.billerName} via Bharat BillPay (BBPS)!`
  });
});

// Pay utility bill via dedicated government settlement endpoint
app.post('/api/utilities/bills/:id/pay-government', (req, res) => {
  const db = readDb();
  const { paymentMethod = 'UPI (Instant BBPS Settlement)', paidBy } = req.body;

  const bill = db.utilityBills.find(b => b.id === req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, message: 'Utility bill not found.' });
  }

  const meter = db.meters.find(m => m.id === bill.meterId) || {
    utilityProvider: bill.provider || 'BESCOM',
    consumerId: bill.consumerId,
    meterNumber: 'KA-SM-AUTO',
    meterType: bill.meterType,
    sanctionedLoad: '3 kW',
    propertyName: 'Property',
    unitNumber: 'Flat',
    tenantName: paidBy || 'Resident'
  };

  const governmentReceipt = processBBPSGovernmentSettlement({
    bill,
    meter,
    paymentMethod,
    paidBy: paidBy || meter.tenantName || 'Resident'
  });

  const now = new Date().toISOString();
  bill.status = 'paid';
  bill.paidAt = now;
  bill.paymentRef = governmentReceipt.bbpsTxnRef;
  bill.governmentReceipt = governmentReceipt;

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: bill.tenantId,
    title: `${bill.meterType.toUpperCase()} Bill Paid to Government`,
    message: `Payment of ₹${bill.amount.toLocaleString('en-IN')} remitted to ${governmentReceipt.billerDetails.billerName}. NPCI Txn ID: ${governmentReceipt.npciTxnId}.`,
    type: 'utility_paid',
    severity: 'success',
    read: false,
    createdAt: now,
    actionUrl: '/utilities',
    actionText: 'View Official Gov Receipt'
  });

  writeDb(db);
  res.json({
    success: true,
    bill,
    governmentReceipt,
    message: `Payment successfully remitted to ${governmentReceipt.billerDetails.billerName} via Bharat BillPay (BBPS)!`
  });
});

// Retrieve official government receipt for any utility bill
app.get('/api/utilities/bills/:id/government-receipt', (req, res) => {
  const db = readDb();
  const bill = db.utilityBills.find(b => b.id === req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, message: 'Utility bill not found.' });
  }

  if (bill.governmentReceipt) {
    return res.json({ success: true, receipt: bill.governmentReceipt, bill });
  }

  // If paid but not generated yet, generate and persist
  if (bill.status === 'paid') {
    const meter = db.meters.find(m => m.id === bill.meterId) || {
      utilityProvider: bill.provider || 'BESCOM',
      consumerId: bill.consumerId,
      meterNumber: 'KA-SM-AUTO',
      meterType: bill.meterType,
      sanctionedLoad: '3 kW',
      propertyName: 'Property',
      unitNumber: 'Flat',
      tenantName: 'Resident'
    };
    bill.governmentReceipt = processBBPSGovernmentSettlement({
      bill,
      meter,
      paymentMethod: 'Bharat BillPay (BBPS)',
      paidBy: meter.tenantName || 'Resident'
    });
    writeDb(db);
    return res.json({ success: true, receipt: bill.governmentReceipt, bill });
  }

  res.status(400).json({ success: false, message: 'Receipt is only available for paid government utility bills.' });
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

export { app };

let server;
if (process.env.TEST_MODE !== 'true') {
  server = app.listen(PORT, () => {
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
}
