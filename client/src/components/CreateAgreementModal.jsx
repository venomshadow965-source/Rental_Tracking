import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Building, 
  User, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  Droplets,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CreateAgreementModal({ 
  onClose, 
  onSubmit, 
  properties, 
  units, 
  users,
  currentUser,
  agreements = [],
  initialTenantId = null
}) {
  const tenants = users.filter(u => u.role === 'tenant');
  const adminUser = users.find(u => u.role === 'admin');

  // Filter out occupied units or units with an active agreement until they become vacant
  const activeAgreementUnitIds = new Set(
    (agreements || [])
      .filter(a => a.status !== 'terminated' && a.status !== 'expired' && a.status !== 'cancelled')
      .map(a => a.unitId)
      .filter(Boolean)
  );

  // If a specific tenant was requested (e.g. from registration notification), preselect them
  const targetTenant = (initialTenantId && tenants.find(t => t.id === initialTenantId)) || tenants[0];

  const availableUnits = (units || []).filter(u => {
    const hasActiveAgreement = activeAgreementUnitIds.has(u.id);
    const isOccupiedByAnother = (u.status === 'occupied' || hasActiveAgreement) && 
      u.tenantId && u.tenantId !== targetTenant?.id;
    const isAssignedToThisTenant = targetTenant && (u.tenantId === targetTenant.id || targetTenant.assignedUnitId === u.id);

    if (hasActiveAgreement && !isAssignedToThisTenant) {
      return false; // Already has an active agreement! Do not show until vacant.
    }
    if (u.status === 'occupied' && !isAssignedToThisTenant) {
      return false; // Already occupied! Do not show until vacant.
    }
    return true;
  });

  const initialUnitId = (targetTenant?.assignedUnitId && availableUnits.some(u => u.id === targetTenant.assignedUnitId))
    ? targetTenant.assignedUnitId 
    : (availableUnits[0]?.id || '');
  const initialUnit = availableUnits.find(u => u.id === initialUnitId) || availableUnits[0];

  // Form State
  const [selectedTenantId, setSelectedTenantId] = useState(targetTenant?.id || '');
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId);
  
  const [tenantName, setTenantName] = useState(targetTenant?.name || '');
  const [tenantFatherName, setTenantFatherName] = useState('');
  const [tenantAadhaar, setTenantAadhaar] = useState(targetTenant?.aadhaar || '');
  const [tenantPan, setTenantPan] = useState(targetTenant?.pan || '');
  const [tenantPhone, setTenantPhone] = useState(targetTenant?.phone || '');
  const [tenantEmail, setTenantEmail] = useState(targetTenant?.email || '');
  const [tenantPermanentAddress, setTenantPermanentAddress] = useState(targetTenant?.permanentAddress || '');

  const [monthlyRent, setMonthlyRent] = useState(targetTenant?.monthlyRent || initialUnit?.rent || 20000);
  const [securityDeposit, setSecurityDeposit] = useState(targetTenant?.securityDeposit || initialUnit?.deposit || 100000);
  const [maintenanceCharges, setMaintenanceCharges] = useState(targetTenant?.maintenance || initialUnit?.maintenance || 2000);
  const [termMonths, setTermMonths] = useState(11);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 11 * 30 * 86400000).toISOString().split('T')[0]
  );
  const [rentDueDateDay, setRentDueDateDay] = useState(5);
  const [lockInPeriodMonths, setLockInPeriodMonths] = useState(3);
  const [noticePeriodMonths, setNoticePeriodMonths] = useState(1);
  const [annualEscalationPercent, setAnnualEscalationPercent] = useState(5);

  const [electricityConsumerId, setElectricityConsumerId] = useState('88472915');
  const [electricityMeterNo, setElectricityMeterNo] = useState('KA-BES-2024-995');
  const [waterConsumerId, setWaterConsumerId] = useState('BW-KOR-305');
  const [waterMeterNo, setWaterMeterNo] = useState('WTR-7730');

  const [stampDutyAmount, setStampDutyAmount] = useState(500);
  const [stampIssueState, setStampIssueState] = useState('Government of Karnataka');
  const [stampCertificateNo, setStampCertificateNo] = useState(
    `IN-KA${Math.floor(10000000000000 + Math.random() * 90000000000000)}U`
  );

  const [witness1Name, setWitness1Name] = useState('Vikram Rao');
  const [witness1Address, setWitness1Address] = useState('HSR Layout, Bengaluru');
  const [witness2Name, setWitness2Name] = useState('Ananya Gupta');
  const [witness2Address, setWitness2Address] = useState('Indiranagar, Bengaluru');

  const [notes, setNotes] = useState('Standard residential agreement drafted per Indian Model Tenancy Act provisions.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Tenant selection change
  const handleTenantChange = (tenantId) => {
    setSelectedTenantId(tenantId);
    const t = tenants.find(user => user.id === tenantId);
    if (t) {
      setTenantName(t.name);
      setTenantAadhaar(t.aadhaar);
      setTenantPan(t.pan || '');
      setTenantPhone(t.phone || '');
      setTenantEmail(t.email || '');
      setTenantPermanentAddress(t.permanentAddress || '');
      if (t.assignedUnitId) {
        setSelectedUnitId(t.assignedUnitId);
        const u = units.find(unit => unit.id === t.assignedUnitId);
        if (u) {
          setMonthlyRent(u.rent);
          setSecurityDeposit(u.deposit);
          setMaintenanceCharges(u.maintenance);
        }
      }
    }
  };

  // Handle Unit selection change
  const handleUnitChange = (unitId) => {
    setSelectedUnitId(unitId);
    const u = units.find(unit => unit.id === unitId);
    if (u) {
      setMonthlyRent(u.rent);
      setSecurityDeposit(u.deposit);
      setMaintenanceCharges(u.maintenance);
    }
  };

  // Aadhaar auto-formatting (4-4-4 digits)
  const handleAadhaarChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += '-';
      formatted += val[i];
    }
    setTenantAadhaar(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!availableUnits || availableUnits.length === 0) {
      setError('No vacant units are available. Occupied units cannot have a new agreement made until vacated.');
      return;
    }
    if (!tenantName || !tenantAadhaar || !monthlyRent || !securityDeposit) {
      setError('Please fill all mandatory fields: Tenant Name, Aadhaar, Monthly Rent, and Security Deposit.');
      return;
    }

    const cleanAadhaar = tenantAadhaar.replace(/-/g, '');
    if (cleanAadhaar.length !== 12) {
      setError('Aadhaar number must contain exactly 12 digits (format: XXXX-XXXX-XXXX)');
      return;
    }

    setLoading(true);
    setError('');

    const targetUnit = availableUnits.find(u => u.id === selectedUnitId) || availableUnits[0];

    const agreementPayload = {
      propertyId: targetUnit?.propertyId || 'prop_1',
      unitId: selectedUnitId,
      tenantId: selectedTenantId,
      tenantName,
      tenantFatherName: tenantFatherName || 'Ramesh Verma',
      tenantAadhaar,
      tenantPan,
      tenantPhone,
      tenantEmail,
      tenantPermanentAddress,
      landlordName: currentUser?.name || adminUser?.name || 'Achyuta Bidarahalli',
      landlordFatherName: 'Late O. P. Sharma',
      landlordAadhaar: currentUser?.aadhaar || adminUser?.aadhaar || '9876-5432-1098',
      landlordPan: currentUser?.pan || adminUser?.pan || 'ABCPS1234F',
      landlordPhone: currentUser?.phone || adminUser?.phone || '+91 98765 43210',
      landlordAddress: currentUser?.address || adminUser?.address || 'Koramangala, Bengaluru, Karnataka',
      termMonths,
      startDate,
      endDate,
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit),
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
      witness1Name,
      witness1Address,
      witness2Name,
      witness2Address,
      notes
    };

    try {
      await onSubmit(agreementPayload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate agreement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Draft Official Indian Rental Agreement
              </h3>
              <p className="text-xs text-slate-500">
                Indian Stamp Paper & Tenancy Act template with Aadhaar details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {initialTenantId && targetTenant && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-3 text-xs text-emerald-950">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Newly Registered Tenant Auto-Selected:</span>{' '}
                <span>{targetTenant.name} ({targetTenant.unitNumber || 'Assigned Unit'}) • Verified Aadhaar: <strong className="font-mono">{targetTenant.aadhaar}</strong></span>
              </div>
            </div>
          )}

          {/* SECTION 1: Tenant & Unit Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>1. Tenant & Property Selection</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Existing Tenant
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  className="w-full text-xs font-medium py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
                  ))}
                  <option value="">+ New Tenant Profile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Select Property Unit</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {availableUnits.length} Vacant & Available
                  </span>
                </label>
                {availableUnits.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">No Vacant Units Available</strong>
                      All property units currently have active rental agreements or are occupied. Occupied units cannot be re-rented until the current tenant vacates.
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedUnitId}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className="w-full text-xs font-medium py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    {availableUnits.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.propertyName} - {u.number} ({u.type}) - ₹{u.rent?.toLocaleString('en-IN')}/mo
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Tenant Legal Details (Aadhaar, PAN, Father's Name) */}
          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>2. Tenant Legal Identity (Required by Indian Tenancy Law)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tenant Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="e.g. Priya Verma"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tenant Father's / Husband's Name
                </label>
                <input
                  type="text"
                  value={tenantFatherName}
                  onChange={(e) => setTenantFatherName(e.target.value)}
                  placeholder="e.g. Ramesh Verma"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center justify-between">
                  <span>Tenant Aadhaar Number (12 Digits) *</span>
                  <span className="text-[10px] text-emerald-700 font-mono">XXXX-XXXX-XXXX</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={tenantAadhaar}
                  onChange={handleAadhaarChange}
                  placeholder="5432-8765-9876"
                  className="w-full text-xs font-mono font-bold tracking-wider py-2 px-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-emerald-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tenant PAN Card Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={tenantPan}
                  onChange={(e) => setTenantPan(e.target.value.toUpperCase())}
                  placeholder="e.g. BRIPV4321E"
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  placeholder="tenant@gmail.com"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Permanent Hometown Address (as per Aadhaar)
                </label>
                <textarea
                  rows={2}
                  value={tenantPermanentAddress}
                  onChange={(e) => setTenantPermanentAddress(e.target.value)}
                  placeholder="Flat 401, Galaxy Heights, Gomti Nagar, Lucknow, UP - 226010"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Commercial & Tenancy Terms */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>3. Commercial & Lease Terms</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Rent (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="w-full text-xs font-bold py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Security Deposit (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="w-full text-xs font-bold py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maintenance (₹/mo)
                </label>
                <input
                  type="number"
                  value={maintenanceCharges}
                  onChange={(e) => setMaintenanceCharges(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lease Term (Months)
                </label>
                <input
                  type="number"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rent Due Day of Month
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={rentDueDateDay}
                  onChange={(e) => setRentDueDateDay(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lock-in Period (Months)
                </label>
                <input
                  type="number"
                  value={lockInPeriodMonths}
                  onChange={(e) => setLockInPeriodMonths(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notice Period (Months)
                </label>
                <input
                  type="number"
                  value={noticePeriodMonths}
                  onChange={(e) => setNoticePeriodMonths(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Dedicated Government Meters in Agreement */}
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>4. Dedicated Government Meter Numbers (Clause 5)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Electricity Consumer ID / CA / RR No.
                </label>
                <input
                  type="text"
                  value={electricityConsumerId}
                  onChange={(e) => setElectricityConsumerId(e.target.value)}
                  placeholder="e.g. 88472910 (BESCOM)"
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Water Consumer ID / Meter ID
                </label>
                <input
                  type="text"
                  value={waterConsumerId}
                  onChange={(e) => setWaterConsumerId(e.target.value)}
                  placeholder="e.g. BW-KOR-302 (BWSSB)"
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: Indian e-Stamp & Witnesses */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>5. e-Stamp Certificate & Two Witnesses</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stamp Certificate No.
                </label>
                <input
                  type="text"
                  value={stampCertificateNo}
                  onChange={(e) => setStampCertificateNo(e.target.value)}
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stamp Duty Amount (₹)
                </label>
                <input
                  type="number"
                  value={stampDutyAmount}
                  onChange={(e) => setStampDutyAmount(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issuing State
                </label>
                <input
                  type="text"
                  value={stampIssueState}
                  onChange={(e) => setStampIssueState(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Witness 1 (Name & Address)
                </label>
                <input
                  type="text"
                  value={witness1Name}
                  onChange={(e) => setWitness1Name(e.target.value)}
                  placeholder="Vikram Rao"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white mb-1.5"
                />
                <input
                  type="text"
                  value={witness1Address}
                  onChange={(e) => setWitness1Address(e.target.value)}
                  placeholder="HSR Layout, Bengaluru"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Witness 2 (Name & Address)
                </label>
                <input
                  type="text"
                  value={witness2Name}
                  onChange={(e) => setWitness2Name(e.target.value)}
                  placeholder="Ananya Gupta"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white mb-1.5"
                />
                <input
                  type="text"
                  value={witness2Address}
                  onChange={(e) => setWitness2Address(e.target.value)}
                  placeholder="Indiranagar, Bengaluru"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Will be signed by Landlord and sent to Tenant for digital Aadhaar e-Sign.
          </p>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Creating Agreement...' : 'Generate & Send Agreement'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
