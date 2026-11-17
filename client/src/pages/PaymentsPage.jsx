import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';

export default function PaymentsPage({
  invoices = [],
  currentUser,
  onOpenPayRent,
  onOpenHraReceipt,
  onSendRentReminders
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

  // Yearly & Calendar History States
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(10); // 10 = November (0-indexed)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null); // specific day clicked in calendar

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
                        {isPaid && (
                          <div className="flex flex-wrap items-center gap-2 pt-1.5 text-[11px]">
                            <span className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-200 text-emerald-900 px-2.5 py-1 rounded-lg font-medium">
                              <Landmark className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{invoice.paymentMethod || 'Direct Linked Bank Account (Real-Time)'}</span>
                            </span>

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
                            <button
                              type="button"
                              onClick={() => onOpenPayRent(invoice)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all"
                            >
                              <Landmark className="w-3.5 h-3.5" />
                              <span>Pay from Linked Bank A/c</span>
                            </button>
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

    </div>
  );
}
