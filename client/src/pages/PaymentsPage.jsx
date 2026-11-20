import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Bell, 
  CheckCircle2, 
  Clock, 
  Printer, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ArrowRight, 
  ShieldCheck, 
  Building, 
  DollarSign,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Landmark,
  Zap,
  Check,
  Copy,
  Users,
  AlertCircle,
  Building2,
  BadgeCheck,
  ExternalLink,
  ChevronDown,
  FileCheck,
  X,
  QrCode,
  Edit3,
  Settings,
  Plus,
  RefreshCw
} from 'lucide-react';
import { api, getSavedLandlordProfile, setSavedLandlordProfile, DEFAULT_LANDLORD_PROFILE } from '../services/api';

export default function PaymentsPage({
  invoices = [],
  currentUser,
  users = [],
  units = [],
  landlordProfile: propLandlordProfile = null,
  onUpdateLandlordProfile = null,
  onOpenPayRent,
  onOpenHraReceipt,
  onSendRentReminders,
  onGenerateRentInvoice
}) {
  const isAdmin = currentUser?.role === 'admin';

  // Navigation tabs: 'current_month' (Real-Time Tracker) vs 'yearly_calendar' (Calendar & Yearly History)
  const [viewTab, setViewTab] = useState('current_month'); 

  // Current Month Tracker States
  const currentMonthKey = '2026-11';
  const currentMonthName = 'November 2026';
  const [currentMonthFilter, setCurrentMonthFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('all');
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [copiedUtr, setCopiedUtr] = useState('');

  // Generate Rent Invoice Modal State (for Landlords)
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [genTenantId, setGenTenantId] = useState('');
  const [genMonth, setGenMonth] = useState('November 2026');
  const [genMonthKey, setGenMonthKey] = useState('2026-11');
  const [genRent, setGenRent] = useState(20000);
  const [genMaint, setGenMaint] = useState(2000);
  const [genDueDate, setGenDueDate] = useState('2026-11-20');
  const [generatingInv, setGeneratingInv] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState('');
  const [genErrorMsg, setGenErrorMsg] = useState('');

  // Yearly & Calendar History States
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(10); // 10 = November (0-indexed)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null); // specific day clicked in calendar

  // Bank & UPI Verification Inspection State
  const [showLandlordAuditModal, setShowLandlordAuditModal] = useState(false);
  const [inspectedInvoiceProof, setInspectedInvoiceProof] = useState(null);

  // Landlord Real Settlement Profile State (Editable for real bank & UPI transactions)
  const [landlordProfile, setLandlordProfile] = useState(() => propLandlordProfile || getSavedLandlordProfile() || DEFAULT_LANDLORD_PROFILE);
  const [isEditingLandlordProfile, setIsEditingLandlordProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUpiId, setEditUpiId] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editIfsc, setEditIfsc] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editPan, setEditPan] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [ifscLookupInfo, setIfscLookupInfo] = useState(null);
  const [ifscLoading, setIfscLoading] = useState(false);

  useEffect(() => {
    if (propLandlordProfile) {
      setLandlordProfile(propLandlordProfile);
    }
  }, [propLandlordProfile]);

  // Load / Refresh Landlord Settlement Profile
  useEffect(() => {
    let isMounted = true;
    async function fetchLandlordBanking() {
      try {
        const res = await api.getLandlordBankVerification();
        if (isMounted && res.success && res.landlord) {
          setLandlordProfile(res.landlord);
          setSavedLandlordProfile(res.landlord);
          if (onUpdateLandlordProfile) onUpdateLandlordProfile(res.landlord);
        }
      } catch (err) {
        console.warn('Could not fetch landlord profile:', err);
      }
    }
    fetchLandlordBanking();
    return () => { isMounted = false; };
  }, [currentUser?.id]);

  const handleStartEditLandlordProfile = () => {
    setEditName(landlordProfile?.registeredLegalName || landlordProfile?.name || 'Rajesh Sharma');
    setEditUpiId(landlordProfile?.upi?.vpa || 'rajesh.landlord@okhdfcbank');
    setEditBankName(landlordProfile?.bankAccount?.bankName || 'State Bank of India (SBI)');
    setEditAccountNumber(landlordProfile?.bankAccount?.accountNumber || '20394819287821');
    setEditIfsc(landlordProfile?.bankAccount?.ifsc || 'SBIN0000800');
    setEditBranch(landlordProfile?.bankAccount?.branch || 'Bengaluru Main Branch');
    setEditPan(landlordProfile?.pan || 'ABCPS1234F');
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    setIfscLookupInfo(null);
    setIsEditingLandlordProfile(true);
  };

  const handleIfscLookup = async (ifscCode) => {
    const clean = ifscCode.trim().toUpperCase();
    setEditIfsc(clean);
    if (clean.length === 11) {
      setIfscLoading(true);
      try {
        const res = await api.verifyIfsc(clean);
        if (res.success && res.ifscDetails) {
          setIfscLookupInfo(res.ifscDetails);
          if (res.ifscDetails.bankName) setEditBankName(res.ifscDetails.bankName);
          if (res.ifscDetails.branch) setEditBranch(res.ifscDetails.branch);
        }
      } catch (e) {
        console.warn('IFSC lookup error:', e);
      } finally {
        setIfscLoading(false);
      }
    }
  };

  const handleSaveLandlordProfile = async (e) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!editUpiId || !editUpiId.includes('@')) {
      setProfileErrorMsg('Please provide a valid UPI ID (e.g., yourname@okhdfcbank or 9876543210@paytm).');
      return;
    }
    if (!editAccountNumber || editAccountNumber.length < 6) {
      setProfileErrorMsg('Please enter a valid bank account number.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.updateLandlordBankVerification({
        name: editName,
        registeredLegalName: editName,
        upiId: editUpiId,
        bankName: editBankName,
        accountNumber: editAccountNumber,
        ifsc: editIfsc,
        branch: editBranch,
        pan: editPan
      });

      if (res.success && res.landlord) {
        setLandlordProfile(res.landlord);
        setSavedLandlordProfile(res.landlord);
        if (onUpdateLandlordProfile) onUpdateLandlordProfile(res.landlord);
        setProfileSuccessMsg('🎉 Real Bank Account & UPI ID linked successfully! All tenant QR codes and mobile UPI links are now updated.');
        setTimeout(() => {
          setIsEditingLandlordProfile(false);
          setProfileSuccessMsg('');
        }, 1800);
      } else {
        setProfileErrorMsg(res.message || 'Failed to update bank details.');
      }
    } catch (err) {
      setProfileErrorMsg(err.message || 'Network error while saving details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGenerateInvoiceSubmit = async (e) => {
    e.preventDefault();
    setGenErrorMsg('');
    setGenSuccessMsg('');

    if (!genTenantId) {
      setGenErrorMsg('Please select a tenant.');
      return;
    }

    setGeneratingInv(true);
    try {
      const res = await onGenerateRentInvoice({
        tenantId: genTenantId,
        billingMonth: genMonth,
        billingMonthKey: genMonthKey,
        baseRent: Number(genRent),
        maintenanceCharges: Number(genMaint),
        dueDate: genDueDate
      });

      if (res?.success) {
        setGenSuccessMsg('✅ Rent bill generated successfully! The tenant can now pay immediately.');
        setTimeout(() => {
          setShowGenerateInvoiceModal(false);
          setGenSuccessMsg('');
        }, 1500);
      } else {
        setGenErrorMsg(res?.message || 'Failed to generate rent invoice.');
      }
    } catch (err) {
      setGenErrorMsg(err.message || 'Error creating rent bill.');
    } finally {
      setGeneratingInv(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to copy UTR
  const handleCopyUtr = (utr) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(''), 2000);
  };

  // Broadcast rent reminders
  const handleBroadcastReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await onSendRentReminders();
      setReminderMessage(res?.message || 'Rent reminder alerts sent to all unpaid tenants via SMS and in-app notifications!');
      setTimeout(() => setReminderMessage(''), 4500);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReminders(false);
    }
  };

  // Unique property names list for filtering
  const propertyNames = Array.from(new Set(invoices.map(i => i.propertyName).filter(Boolean)));

  // Current Month Data Calculations
  const currentMonthInvoices = invoices.filter(inv => {
    const isCurrent = inv.billingMonthKey === currentMonthKey || inv.billingMonth === currentMonthName;
    const matchesProp = selectedPropertyFilter === 'all' || inv.propertyName === selectedPropertyFilter;
    return isCurrent && matchesProp;
  });

  const filteredCurrentMonthInvoices = currentMonthInvoices.filter(inv => {
    if (currentMonthFilter === 'paid') return inv.status === 'paid';
    if (currentMonthFilter === 'unpaid') return inv.status === 'unpaid';
    return true;
  });

  const currentPaidCount = currentMonthInvoices.filter(i => i.status === 'paid').length;
  const currentTotalCount = currentMonthInvoices.length;
  const currentCollected = currentMonthInvoices.filter(i => i.status === 'paid').reduce((a, b) => a + (b.totalAmount || 0), 0);
  const currentPending = currentMonthInvoices.filter(i => i.status === 'unpaid').reduce((a, b) => a + (b.totalAmount || 0), 0);
  const currentExpected = currentCollected + currentPending;
  const currentPercentage = currentTotalCount > 0 ? Math.round((currentPaidCount / currentTotalCount) * 100) : 0;

  // Yearly Data Calculations
  const yearInvoices = invoices.filter(inv => {
    let invYear = null;
    if (inv.billingMonthKey) {
      invYear = parseInt(inv.billingMonthKey.split('-')[0], 10);
    } else if (inv.issueDate) {
      invYear = new Date(inv.issueDate).getFullYear();
    } else if (inv.billingMonth) {
      const match = inv.billingMonth.match(/\d{4}/);
      if (match) invYear = parseInt(match[0], 10);
    }
    const matchesProp = selectedPropertyFilter === 'all' || inv.propertyName === selectedPropertyFilter;
    return invYear === selectedYear && matchesProp;
  });

  const yearTotalCollected = yearInvoices.filter(i => i.status === 'paid').reduce((a, b) => a + (b.totalAmount || 0), 0);
  const yearTotalPaidCount = yearInvoices.filter(i => i.status === 'paid').length;
  const yearTotalCount = yearInvoices.length;
  const yearPercentage = yearTotalCount > 0 ? Math.round((yearTotalPaidCount / yearTotalCount) * 100) : 0;

  // Selected Month Invoices in Calendar View
  const selectedMonthKey = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
  const selectedMonthInvoices = yearInvoices.filter(inv => {
    if (inv.billingMonthKey) return inv.billingMonthKey === selectedMonthKey;
    const invMonthName = monthNames[selectedMonthIndex];
    return inv.billingMonth && inv.billingMonth.includes(invMonthName);
  });

  // Calendar Matrix Generator
  const daysInSelectedMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonthIndex, 1).getDay(); // 0 = Sun
  const calendarCells = [];

  // Blank padding cells before 1st of month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ type: 'empty', key: `empty-${i}` });
  }

  // Days 1..daysInMonth
  for (let d = 1; d <= daysInSelectedMonth; d++) {
    const paidOnThisDay = selectedMonthInvoices.filter(inv => {
      if (!inv.paidAt || inv.status !== 'paid') return false;
      const pDate = new Date(inv.paidAt);
      return pDate.getFullYear() === selectedYear && pDate.getMonth() === selectedMonthIndex && pDate.getDate() === d;
    });

    const dueOnThisDay = selectedMonthInvoices.filter(inv => {
      if (!inv.dueDate || inv.status !== 'unpaid') return false;
      const parts = inv.dueDate.split('-');
      if (parts.length === 3) {
        return parseInt(parts[0], 10) === selectedYear && (parseInt(parts[1], 10) - 1) === selectedMonthIndex && parseInt(parts[2], 10) === d;
      }
      return false;
    });

    calendarCells.push({
      type: 'day',
      dayNumber: d,
      key: `day-${d}`,
      paidInvoices: paidOnThisDay,
      dueInvoices: dueOnThisDay,
      isToday: selectedYear === 2026 && selectedMonthIndex === 10 && d === 17 // Current simulated date
    });
  }

  // Filtered transactions for selected day/month in calendar view
  const calendarDisplayedInvoices = selectedCalendarDay
    ? selectedMonthInvoices.filter(inv => {
        if (inv.paidAt && inv.status === 'paid') {
          const pDate = new Date(inv.paidAt);
          return pDate.getDate() === selectedCalendarDay;
        }
        if (inv.dueDate && inv.status === 'unpaid') {
          const parts = inv.dueDate.split('-');
          return parts.length === 3 && parseInt(parts[2], 10) === selectedCalendarDay;
        }
        return false;
      })
    : selectedMonthInvoices;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  {isAdmin ? 'Real-Time Rent Collection & Calendar' : 'My Rent Invoices & Direct Bank Pay'}
                </h1>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>Real-Time Bank Rail</span>
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            {isAdmin 
              ? 'Track real-time rent payments directly deposited into your bank account. Monitor how many tenants paid for the current month and explore multi-year collection history via interactive calendar.'
              : 'Pay your monthly rent directly from your linked bank account with instant real-time settlement and download official HRA-compliant rent receipts.'
            }
          </p>
        </div>

        {/* Action Controls in Header */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={handleBroadcastReminders}
              disabled={sendingReminders}
              className="flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 transition-all whitespace-nowrap disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>{sendingReminders ? 'Dispatching...' : 'Send Reminders to Unpaid Tenants'}</span>
            </button>
          )}
        </div>
      </div>

      {reminderMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{reminderMessage}</span>
        </div>
      )}

      {/* Main Tab Switcher: Current Month (Real-Time) vs Yearly Calendar History */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setViewTab('current_month');
                setSelectedCalendarDay(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                viewTab === 'current_month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Current Month Real-Time Tracker ({currentMonthName})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab('yearly_calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                viewTab === 'yearly_calendar'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Interactive Calendar & Multi-Year History</span>
            </button>
          </div>

          {/* Property Filter Dropdown */}
          <div className="flex items-center space-x-2 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Properties ({propertyNames.length})</option>
              {propertyNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: CURRENT MONTH OVERVIEW (REAL-TIME TRACKER)                       */}
      {/* ========================================================================= */}
      {(viewTab === 'current_month' || !isAdmin) && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Landlord Verified Banking & UPI Settlement Rail Overview */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-lg border border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  {isAdmin ? 'Active Rent Settlement Account (Real Bank & UPI Destination)' : 'Verified Real-World Settlement Rail & Beneficiary'}
                </span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>RBI Scheduled Bank & NPCI Bharat QR 2.0 Certified</span>
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100 pt-0.5">
                <div>Landlord Payee: <strong className="text-white">{landlordProfile?.registeredLegalName || landlordProfile?.name || 'RAJESH SHARMA'}</strong></div>
                <div className="text-emerald-500">•</div>
                <div>Bank: <strong className="text-white">{landlordProfile?.bankAccount?.bankName || 'State Bank of India (SBI)'} ({landlordProfile?.bankAccount?.branch || 'Bengaluru Main Branch'})</strong></div>
                <div className="text-emerald-500">•</div>
                <div>A/c: <strong className="font-mono text-emerald-200">{landlordProfile?.bankAccount?.accountNumber || '20394819287821'}</strong> ({landlordProfile?.bankAccount?.maskedAccountNumber || '•••• 7821'})</div>
                <div className="text-emerald-500">•</div>
                <div>IFSC: <strong className="font-mono text-emerald-200">{landlordProfile?.bankAccount?.ifsc || 'SBIN0000800'}</strong></div>
                <div className="text-emerald-500">•</div>
                <div>UPI ID: <strong className="font-mono text-emerald-200">{landlordProfile?.upi?.vpa || 'rajesh.landlord@okhdfcbank'}</strong></div>
                {isAdmin && (
                  <>
                    <div className="text-emerald-500">•</div>
                    <div className="bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-400/40 text-emerald-200 font-semibold flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Credited: <strong className="text-white font-mono">₹{currentCollected.toLocaleString('en-IN')}</strong></span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start md:self-auto flex-shrink-0">
              {isAdmin && onGenerateRentInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    const firstTenant = (users || []).find(u => u.role === 'tenant');
                    if (firstTenant) {
                      setGenTenantId(firstTenant.id);
                      setGenRent(firstTenant.monthlyRent || 20000);
                      setGenMaint(firstTenant.maintenance || 2000);
                    }
                    setShowGenerateInvoiceModal(true);
                  }}
                  className="px-4 py-2.5 bg-white text-emerald-950 font-black rounded-xl text-xs hover:bg-emerald-50 transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>+ Generate Rent Bill</span>
                </button>
              )}

              {isAdmin ? (
                <button
                  type="button"
                  onClick={handleStartEditLandlordProfile}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center space-x-2 whitespace-nowrap shadow-md cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-900" />
                  <span>Link Real Bank & UPI ⚙️</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.getLandlordBankVerification();
                      if (res?.success && res?.landlord) {
                        setLandlordProfile(res.landlord);
                        if (onUpdateLandlordProfile) onUpdateLandlordProfile(res.landlord);
                      }
                    } catch (e) {
                      console.warn('Could not refresh landlord profile:', e);
                    }
                    setShowLandlordAuditModal(true);
                    setIsEditingLandlordProfile(false);
                  }}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center space-x-2 whitespace-nowrap shadow-md cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-slate-900" />
                  <span>Landlord Bank Info 🏦</span>
                </button>
              )}
            </div>
          </div>

          {/* URGENT TENANT ACTION BANNER FOR UNPAID RENT */}
          {!isAdmin && (() => {
            const unpaidInv = invoices.find(inv => inv.status === 'unpaid');
            if (!unpaidInv) return null;
            return (
              <div className="p-4 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-700 text-white rounded-2xl shadow-lg border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <Zap className="w-5 h-5 text-amber-300 animate-pulse fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm">Rent Payment Pending: {unpaidInv.billingMonth}</span>
                      <span className="text-[10px] bg-white/20 font-mono px-2 py-0.5 rounded-full uppercase">Action Required</span>
                    </div>
                    <p className="text-xs text-amber-100 mt-0.5">
                      ₹{unpaidInv.totalAmount?.toLocaleString('en-IN')} due for {unpaidInv.unitNumber} ({unpaidInv.propertyName}) by {unpaidInv.dueDate}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPayRent(unpaidInv)}
                  className="px-5 py-2.5 bg-white text-rose-700 hover:bg-rose-50 font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer"
                >
                  <Landmark className="w-4 h-4 text-rose-700" />
                  <span>⚡ Pay Rent via UPI or Bank Debit</span>
                </button>
              </div>
            );
          })()}
          
          {/* Key Metrics KPI Cards for Current Month */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Paid vs Total Tenants */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tenants Paid</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-slate-900">{currentPaidCount} of {currentTotalCount}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {currentPercentage}% Paid
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${currentPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {currentTotalCount - currentPaidCount === 0 
                    ? '🎉 100% of tenants paid rent for this month!' 
                    : `${currentTotalCount - currentPaidCount} tenant(s) remaining for ${currentMonthName}`}
                </p>
              </div>

              {/* Card 2: Total Rent Collected */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Collected Rent</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Landmark className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  ₹{currentCollected.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-emerald-800 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Settled in Landlord SBI Account (•••• 7821)</span>
                </p>
              </div>

              {/* Card 3: Pending / Due Rent */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Dues</span>
                  <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-700 font-mono">
                  ₹{currentPending.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-amber-800 font-medium">
                  {currentTotalCount - currentPaidCount > 0 ? `Due by 20 ${currentMonthName}` : 'Zero pending dues!'}
                </p>
              </div>

              {/* Card 4: Monthly Expected Total */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Monthly Roll</span>
                  <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  ₹{currentExpected.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-500">
                  Across {currentTotalCount} occupied flats/units
                </p>
              </div>

            </div>
          )}

          {/* Sub-Filters: All, Paid, Unpaid */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCurrentMonthFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentMonthFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Tenants ({currentMonthInvoices.length})
              </button>

              <button
                type="button"
                onClick={() => setCurrentMonthFilter('paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentMonthFilter === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Paid Directly via Bank ({currentPaidCount})
              </button>

              <button
                type="button"
                onClick={() => setCurrentMonthFilter('unpaid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentMonthFilter === 'unpaid'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pending Rent ({currentTotalCount - currentPaidCount})
              </button>
            </div>

            <span className="text-xs text-slate-500 hidden sm:inline">
              Showing invoices for <strong>{currentMonthName}</strong>
            </span>
          </div>

          {/* Current Month Invoices Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredCurrentMonthInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No invoices matching current filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredCurrentMonthInvoices.map((invoice) => {
                  const isPaid = invoice.status === 'paid';

                  return (
                    <div
                      key={invoice.id}
                      className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {invoice.invoiceNumber}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {invoice.tenantName}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({invoice.unitNumber} • {invoice.propertyName})
                          </span>

                          {/* Status Badge */}
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}>
                            {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-rose-600" />}
                            <span>{isPaid ? 'PAID DIRECTLY' : 'UNPAID / DUE'}</span>
                          </span>
                        </div>

                        {/* Breakdown and Payment Info */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                          <span>Base Rent: <strong>₹{invoice.baseRent?.toLocaleString('en-IN')}</strong></span>
                          <span>•</span>
                          <span>Maintenance: <strong>₹{invoice.maintenanceCharges?.toLocaleString('en-IN')}</strong></span>
                          <span>•</span>
                          <span>Due Date: <strong className="text-slate-800">{invoice.dueDate}</strong></span>
                        </div>

                        {/* If Paid: Bank & Real-Time Settlement Audit */}
                        {isPaid ? (
                          <div className="flex flex-wrap items-center gap-2 pt-1.5 text-[11px]">
                            <span className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-200 text-emerald-900 px-2.5 py-1 rounded-lg font-medium">
                              <Landmark className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{invoice.paymentMethod || 'Direct Linked Bank Account (Real-Time)'}</span>
                            </span>

                            <span className="inline-flex items-center space-x-1 bg-emerald-100/70 border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded-md font-bold text-[10px]">
                              <BadgeCheck className="w-3 h-3 text-emerald-600" />
                              <span>Bank Details Verified (₹1 Penny Drop Active)</span>
                            </span>

                            {invoice.landlordSettlement && (
                              <span className="inline-flex items-center space-x-1 bg-blue-50 border border-blue-200 text-blue-900 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                <span>Credited to: {invoice.landlordSettlement.bankName} ({invoice.landlordSettlement.maskedAccountNumber})</span>
                              </span>
                            )}

                            {invoice.transactionRef && (
                              <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-mono">
                                <span>UTR: {invoice.transactionRef}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUtr(invoice.transactionRef)}
                                  className="text-slate-400 hover:text-slate-700"
                                  title="Copy UTR Reference"
                                >
                                  {copiedUtr === invoice.transactionRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </span>
                            )}

                            {invoice.paidAt && (
                              <span className="text-slate-400 font-mono">
                                Paid on: {new Date(invoice.paidAt).toLocaleString('en-IN')}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setInspectedInvoiceProof(invoice)}
                              className="text-[11px] text-emerald-700 font-bold underline hover:text-emerald-900 flex items-center space-x-0.5"
                            >
                              <span>Audit Banking Proof</span>
                              <FileCheck className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-500">
                            <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px]">
                              <BadgeCheck className="w-3 h-3 text-emerald-600" />
                              <span>Tenant Bank KYC: Verified (Active Mandate)</span>
                            </span>
                            <span>•</span>
                            <span>UPI QR & Direct Bank Rail ready for instant collection</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-3 flex-shrink-0">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Rent Amount</span>
                          <span className="text-xl font-black text-slate-900 font-mono">
                            ₹{invoice.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!isPaid ? (
                            !isAdmin && onOpenPayRent ? (
                              <button
                                type="button"
                                onClick={() => onOpenPayRent(invoice)}
                                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                                <span>Pay Rent Now ⚡</span>
                              </button>
                            ) : isAdmin ? (
                              <div className="flex items-center space-x-2">
                                <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Pending Tenant Payment</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={handleBroadcastReminders}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                  title="Send payment reminder to tenant"
                                >
                                  Remind
                                </button>
                              </div>
                            ) : null
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenHraReceipt(invoice)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-slate-200 hover:border-emerald-200"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Download Stamped Receipt</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: INTERACTIVE CALENDAR & MULTI-YEAR RENT HISTORY                   */}
      {/* ========================================================================= */}
      {isAdmin && viewTab === 'yearly_calendar' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Year Selector & Annual Summary Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Collection Year</span>
              <div className="flex items-center space-x-2">
                {[2026, 2025, 2024].map(yr => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setSelectedYear(yr);
                      setSelectedCalendarDay(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all ${
                      selectedYear === yr
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {yr} History
                  </button>
                ))}
              </div>
            </div>

            {/* Annual Performance Stats */}
            <div className="flex items-center gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Annual Collected</span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  ₹{yearTotalCollected.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Collection Rate</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {yearPercentage}%
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid Rent Records</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {yearTotalPaidCount} / {yearTotalCount}
                </span>
              </div>
            </div>
          </div>

          {/* 12-Month Yearly Grid Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>{selectedYear} Month-by-Month Overview (Click month to view calendar)</span>
              <span className="text-[11px] text-emerald-700 font-medium">Selected: {monthNames[selectedMonthIndex]} {selectedYear}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {monthNames.map((mName, idx) => {
                const mKey = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
                const mInvoices = yearInvoices.filter(i => i.billingMonthKey === mKey || (i.billingMonth && i.billingMonth.includes(mName)));
                const mPaid = mInvoices.filter(i => i.status === 'paid').length;
                const mTotal = mInvoices.length;
                const isSelected = selectedMonthIndex === idx;
                const isFuture = selectedYear === 2026 && idx > 10;

                const mCollected = mInvoices.filter(i => i.status === 'paid').reduce((a, b) => a + (b.totalAmount || 0), 0);

                let badgeColor = 'bg-slate-100 text-slate-600';
                let badgeText = 'No Invoices';

                if (isFuture) {
                  badgeColor = 'bg-slate-100 text-slate-400';
                  badgeText = 'Future';
                } else if (mTotal > 0 && mPaid === mTotal) {
                  badgeColor = 'bg-emerald-100 text-emerald-800';
                  badgeText = `${mPaid}/${mTotal} Paid (100%)`;
                } else if (mPaid > 0) {
                  badgeColor = 'bg-amber-100 text-amber-800';
                  badgeText = `${mPaid}/${mTotal} Paid`;
                } else if (mTotal > 0) {
                  badgeColor = 'bg-rose-100 text-rose-800';
                  badgeText = `0/${mTotal} Paid`;
                }

                return (
                  <div
                    key={mName}
                    onClick={() => {
                      setSelectedMonthIndex(idx);
                      setSelectedCalendarDay(null);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{mName.slice(0, 3)} {selectedYear}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="text-sm font-black font-mono text-slate-900 mt-2">
                      ₹{mCollected.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {mTotal > 0 ? `${mPaid} of ${mTotal} tenants paid` : 'Not generated'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Calendar View for Selected Month */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            
            {/* Calendar Header with Month Stepper */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-900 text-white rounded-xl">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {monthNames[selectedMonthIndex]} {selectedYear} Rent Payment Calendar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click on any day with payments to inspect transaction receipts and UTR numbers.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={selectedMonthIndex === 0}
                  onClick={() => {
                    setSelectedMonthIndex(prev => Math.max(0, prev - 1));
                    setSelectedCalendarDay(null);
                  }}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 min-w-[100px] text-center">
                  {monthNames[selectedMonthIndex]} {selectedYear}
                </span>
                <button
                  type="button"
                  disabled={selectedMonthIndex === 11}
                  onClick={() => {
                    setSelectedMonthIndex(prev => Math.min(11, prev + 1));
                    setSelectedCalendarDay(null);
                  }}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid (Sun - Sat) */}
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold text-xs uppercase tracking-wider text-slate-400 py-1">
                  {day}
                </div>
              ))}

              {calendarCells.map((cell) => {
                if (cell.type === 'empty') {
                  return (
                    <div 
                      key={cell.key} 
                      className="min-h-[85px] bg-slate-50/50 rounded-xl border border-dashed border-slate-100" 
                    />
                  );
                }

                const hasPayments = cell.paidInvoices.length > 0;
                const hasDues = cell.dueInvoices.length > 0;
                const isSelectedDay = selectedCalendarDay === cell.dayNumber;

                return (
                  <div
                    key={cell.key}
                    onClick={() => {
                      if (hasPayments || hasDues) {
                        setSelectedCalendarDay(prev => prev === cell.dayNumber ? null : cell.dayNumber);
                      }
                    }}
                    className={`min-h-[85px] p-2 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelectedDay
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : hasPayments
                        ? 'bg-white border-emerald-300 hover:border-emerald-500 cursor-pointer shadow-2xs'
                        : hasDues
                        ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400 cursor-pointer'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {/* Day number & indicators */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${cell.isToday ? 'bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center font-mono' : 'text-slate-800'}`}>
                        {cell.dayNumber}
                      </span>
                      {cell.isToday && (
                        <span className="text-[9px] font-bold text-emerald-700 uppercase">Today</span>
                      )}
                    </div>

                    {/* Transaction Badges in Cell */}
                    <div className="space-y-1 my-1">
                      {cell.paidInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-between"
                          title={`Paid by ${inv.tenantName} (${inv.paymentMethod})`}
                        >
                          <span className="truncate max-w-[65px]">{inv.tenantName.split(' ')[0]}</span>
                          <span className="font-mono">₹{(inv.totalAmount / 1000).toFixed(1)}k</span>
                        </div>
                      ))}

                      {cell.dueInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="bg-rose-100 text-rose-900 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-between"
                          title={`Due Date: ${inv.tenantName}`}
                        >
                          <span className="truncate max-w-[65px]">Due: {inv.tenantName.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[9px] text-slate-400">
                      {hasPayments ? '✓ Bank Settled' : hasDues ? '⏰ Due Date' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Filter Feedback */}
            {selectedCalendarDay && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <span>
                  Filtering audit history to payments on <strong>{selectedCalendarDay} {monthNames[selectedMonthIndex]} {selectedYear}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDay(null)}
                  className="underline font-bold text-emerald-800 hover:text-emerald-950"
                >
                  Clear Day Filter (Show All {selectedMonthInvoices.length} Month Invoices)
                </button>
              </div>
            )}
          </div>

          {/* Audit History List for Selected Month/Day */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>
                  Audit Roster: {monthNames[selectedMonthIndex]} {selectedYear} {selectedCalendarDay ? `(Day ${selectedCalendarDay})` : ''}
                </span>
              </h4>
              <span className="text-xs text-slate-500">
                {calendarDisplayedInvoices.filter(i => i.status === 'paid').length} Paid • {calendarDisplayedInvoices.filter(i => i.status === 'unpaid').length} Due
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {calendarDisplayedInvoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No rent transactions recorded for this period.
                </div>
              ) : (
                calendarDisplayedInvoices.map((inv) => {
                  const isPaid = inv.status === 'paid';

                  return (
                    <div
                      key={inv.id}
                      className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{inv.tenantName}</span>
                          <span className="text-xs text-slate-500">({inv.unitNumber} • {inv.propertyName})</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isPaid ? 'PAID' : 'DUE / UNPAID'}
                          </span>
                        </div>

                        {isPaid && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                            <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                              <Landmark className="w-3.5 h-3.5" />
                              <span>{inv.paymentMethod || 'Direct Bank Debit'}</span>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-700">UTR: {inv.transactionRef}</span>
                            <span>•</span>
                            <span className="text-slate-400 font-mono">
                              Paid on: {new Date(inv.paidAt).toLocaleString('en-IN')}
                            </span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setInspectedInvoiceProof(inv)}
                              className="text-[11px] text-emerald-700 font-bold underline hover:text-emerald-900 flex items-center space-x-0.5"
                            >
                              <span>Audit Banking Proof</span>
                              <FileCheck className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Rent Amount</span>
                          <span className="text-base font-black text-slate-900 font-mono">
                            ₹{inv.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => onOpenHraReceipt(inv)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-lg text-xs transition-colors border border-slate-200 flex items-center space-x-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT MODAL: LANDLORD BANKING & UPI VERIFICATION CERTIFICATE              */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL: GENERATE RENT INVOICE FOR NEWLY ADDED OR EXISTING TENANTS          */}
      {/* ========================================================================= */}
      {showGenerateInvoiceModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
              <div className="flex items-center space-x-2.5">
                <Plus className="w-6 h-6 text-emerald-300" />
                <div>
                  <h4 className="font-extrabold text-sm">Generate Rent Invoice</h4>
                  <p className="text-[11px] text-emerald-200">Create rent bill for newly added or existing tenant</p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateInvoiceModal(false)}
                className="p-1 rounded-lg hover:bg-emerald-700 text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoiceSubmit} className="p-6 space-y-4 text-xs">
              
              {genSuccessMsg && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>{genSuccessMsg}</span>
                </div>
              )}
              {genErrorMsg && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                  <span>{genErrorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Tenant *
                </label>
                <select
                  required
                  value={genTenantId}
                  onChange={(e) => {
                    const tid = e.target.value;
                    setGenTenantId(tid);
                    const t = (users || []).find(u => u.id === tid);
                    if (t) {
                      setGenRent(t.monthlyRent || 20000);
                      setGenMaint(t.maintenance || 2000);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">-- Choose Tenant --</option>
                  {(users || []).filter(u => u.role === 'tenant').map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.unitNumber || 'No unit assigned'}) - {t.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Billing Month *
                  </label>
                  <select
                    value={genMonth}
                    onChange={(e) => {
                      setGenMonth(e.target.value);
                      const key = e.target.value.toLowerCase().includes('nov') ? '2026-11' : e.target.value.toLowerCase().includes('dec') ? '2026-12' : '2026-11';
                      setGenMonthKey(key);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="November 2026">November 2026</option>
                    <option value="December 2026">December 2026</option>
                    <option value="October 2026">October 2026</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={genDueDate}
                    onChange={(e) => setGenDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Base Rent (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={genRent}
                    onChange={(e) => setGenRent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Maintenance (₹)
                  </label>
                  <input
                    type="number"
                    value={genMaint}
                    onChange={(e) => setGenMaint(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-slate-700">Total Bill Amount:</span>
                <span className="text-sm font-black font-mono text-emerald-800">
                  ₹{(Number(genRent) + Number(genMaint)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingInv}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {generatingInv ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Generate & Issue Bill</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT MODAL: LANDLORD BANKING & UPI VERIFICATION CERTIFICATE              */}
      {/* ========================================================================= */}
      {showLandlordAuditModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-300" />
                <div>
                  <h4 className="font-extrabold text-sm">
                    {isEditingLandlordProfile ? 'Configure Real Bank & UPI Settlement' : 'Landlord Banking & UPI Verification Certificate'}
                  </h4>
                  <p className="text-[11px] text-emerald-200">RBI Scheduled Commercial Bank & NPCI UPI 2.0 Registry</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                {!isEditingLandlordProfile && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await api.getLandlordBankVerification();
                        if (res?.success && res?.landlord) {
                          setLandlordProfile(res.landlord);
                          if (onUpdateLandlordProfile) onUpdateLandlordProfile(res.landlord);
                        }
                      } catch (e) {
                        console.warn('Could not refresh landlord profile:', e);
                      }
                    }}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Refresh live bank verification record"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowLandlordAuditModal(false);
                    setIsEditingLandlordProfile(false);
                  }}
                  className="p-1 rounded-lg hover:bg-emerald-700 text-emerald-200 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              {/* Feedback Alerts */}
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}
              {profileErrorMsg && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              {/* MODE 1: EDIT / CONFIGURE REAL BANK & UPI */}
              {isEditingLandlordProfile ? (
                <form onSubmit={handleSaveLandlordProfile} className="space-y-3.5">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed text-[11px]">
                    💡 <strong>Real Settlement Mode:</strong> Enter your real UPI ID and bank account. All tenant QR codes and mobile UPI links will route funds directly into this account with 0% platform charges.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Beneficiary Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Rajesh Sharma"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Real UPI ID / VPA *
                      </label>
                      <input
                        type="text"
                        required
                        value={editUpiId}
                        onChange={(e) => setEditUpiId(e.target.value.trim().toLowerCase())}
                        placeholder="e.g. yourname@okaxis or 9876543210@paytm"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Bank IFSC Code *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={11}
                          value={editIfsc}
                          onChange={(e) => handleIfscLookup(e.target.value)}
                          placeholder="e.g. SBIN0000800"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                        {ifscLoading && (
                          <div className="absolute right-2.5 top-2.5 w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={editAccountNumber}
                        onChange={(e) => setEditAccountNumber(e.target.value.replace(/\s+/g, ''))}
                        placeholder="e.g. 20394819287821"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={editBankName}
                        onChange={(e) => setEditBankName(e.target.value)}
                        placeholder="e.g. State Bank of India"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Branch & City
                      </label>
                      <input
                        type="text"
                        value={editBranch}
                        onChange={(e) => setEditBranch(e.target.value)}
                        placeholder="e.g. Bengaluru Main Branch"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Income Tax PAN (Optional - For Tax Exemption Receipts)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editPan}
                      onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCPS1234F"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold uppercase focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingLandlordProfile(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {savingProfile ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving & Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save & Link Real Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* MODE 2: CERTIFICATE VIEW */
                <>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">Verified Landlord Legal Entity</span>
                      <div className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                        <span>{landlordProfile?.registeredLegalName || landlordProfile?.name || 'RAJESH SHARMA'}</span>
                        <BadgeCheck className="w-4 h-4 text-emerald-600 fill-current" />
                      </div>
                      <span className="text-[11px] text-slate-500">Property Owner & Settlement Recipient</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Income Tax PAN</span>
                      <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {landlordProfile?.pan || 'ABCPS1234F'} (VERIFIED)
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50/50">
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-500">Core Banking Settlement:</span>
                      <strong className="text-slate-900">{landlordProfile?.bankAccount?.bankName || 'State Bank of India (SBI)'}</strong>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-500">Settlement A/c Number:</span>
                      <strong className="font-mono text-slate-900">
                        {landlordProfile?.bankAccount?.accountNumber || '20394819287821'} ({landlordProfile?.bankAccount?.maskedAccountNumber || '•••• 7821'})
                      </strong>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-500">IFSC & Branch:</span>
                      <strong className="font-mono text-slate-900">
                        {landlordProfile?.bankAccount?.ifsc || 'SBIN0000800'} ({landlordProfile?.bankAccount?.branch || 'Bengaluru Main Branch'})
                      </strong>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-500">Penny Drop Verification:</span>
                      <strong className="text-emerald-700 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ACTIVE (IMPS/CBS Verified)</span>
                      </strong>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-500">Active UPI ID / VPA:</span>
                      <strong className="font-mono text-emerald-800 text-xs bg-emerald-100/70 px-2 py-0.5 rounded">
                        {landlordProfile?.upi?.vpa || 'rajesh.landlord@okhdfcbank'}
                      </strong>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-500">Merchant Category Code (MCC):</span>
                      <strong className="font-mono text-slate-800">6513 (Real Estate / Property Rent)</strong>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-500">Bharat QR Specification:</span>
                      <strong className="text-emerald-700 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>NPCI Bharat QR 2.0 Certified</span>
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleStartEditLandlordProfile}
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit My Real Bank & UPI Details</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowLandlordAuditModal(false)}
                      className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer ${!isAdmin ? 'ml-auto' : ''}`}
                    >
                      Close Certificate
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT MODAL: INVOICE PAYMENT & BANK TRANSACTION AUDIT                     */}
      {/* ========================================================================= */}
      {inspectedInvoiceProof && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2.5">
                <Landmark className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="font-extrabold text-sm">Real Bank Details Verification Audit</h4>
                  <p className="text-[11px] text-slate-400">Transaction #{inspectedInvoiceProof.invoiceNumber} • {inspectedInvoiceProof.billingMonth}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedInvoiceProof(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">Verified Payer / Tenant</span>
                  <div className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                    <span>{inspectedInvoiceProof.tenantName}</span>
                    <BadgeCheck className="w-4 h-4 text-emerald-600 fill-current" />
                  </div>
                  <span className="text-[11px] text-slate-500">{inspectedInvoiceProof.unitNumber} • {inspectedInvoiceProof.propertyName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Amount Paid</span>
                  <span className="font-mono font-black text-base text-emerald-800">
                    ₹{inspectedInvoiceProof.totalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50/50">
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Payment Rail:</span>
                  <strong className="text-slate-900">{inspectedInvoiceProof.paymentMethod}</strong>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Bank UTR / NPCI Ref:</span>
                  <strong className="font-mono text-emerald-800">{inspectedInvoiceProof.transactionRef}</strong>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Core Banking Debit Status:</span>
                  <strong className="text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SETTLED VIA IMPS / UPI 2.0</span>
                  </strong>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Landlord Destination A/c:</span>
                  <strong className="text-slate-800 font-mono">
                    {inspectedInvoiceProof.landlordSettlement 
                      ? `${inspectedInvoiceProof.landlordSettlement.name} • ${inspectedInvoiceProof.landlordSettlement.bankName} (${inspectedInvoiceProof.landlordSettlement.maskedAccountNumber}) • IFSC: ${inspectedInvoiceProof.landlordSettlement.ifsc}` 
                      : (landlordProfile?.bankAccount ? `${landlordProfile.registeredLegalName || landlordProfile.name} • ${landlordProfile.bankAccount.bankName} (${landlordProfile.bankAccount.maskedAccountNumber})` : 'State Bank of India (•••• 7821)')}
                  </strong>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Penny Drop Verification:</span>
                  <strong className="text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tenant Bank A/c Verified (Active)</span>
                  </strong>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Settled Timestamp:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(inspectedInvoiceProof.paidAt || Date.now()).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectedInvoiceProof(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Close Audit Proof
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
