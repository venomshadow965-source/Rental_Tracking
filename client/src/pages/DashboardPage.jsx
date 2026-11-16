import React from 'react';
import { 
  Building2, 
  CreditCard, 
  Zap, 
  AlertTriangle, 
  FileText, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Droplets,
  Stamp,
  Bell,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage({
  currentUser,
  properties,
  agreements,
  damages,
  invoices,
  meters,
  utilityBills,
  notifications,
  onNavigate,
  onOpenPayRent,
  onOpenCreateAgreement,
  onOpenReportDamage,
  onOpenAgreementViewer,
  onOpenViewInvoice,
  onSendRentReminders
}) {
  const isAdmin = currentUser?.role === 'admin';

  // Common stats
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const pendingDamages = damages.filter(d => d.status === 'under_review' || d.status === 'reported');
  const unpaidUtilityBills = utilityBills.filter(b => b.status === 'unpaid');

  // Tenant specific upcoming rent invoice
  const tenantPendingRent = unpaidInvoices.find(inv => inv.tenantId === currentUser?.id);

  // Total collected rent this month
  const totalRentCollected = paidInvoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalRentPending = unpaidInvoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-200 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'Property Management Console' : 'Tenant Resident Portal'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Namaste, {currentUser?.name}
            </h1>
            <p className="text-emerald-100 text-sm max-w-xl">
              {isAdmin 
                ? `You are overseeing ${properties.length} residential properties with ${unpaidInvoices.length} pending rent collections and ${pendingDamages.length} damage claims.`
                : `You are residing at ${currentUser?.unitNumber} in ${currentUser?.propertyName}. Track your rent, government meters, and damage repair claims easily.`
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin ? (
              <>
                <button
                  onClick={onOpenCreateAgreement}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Make Rental Agreement</span>
                </button>
                <button
                  onClick={onSendRentReminders}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
                >
                  <Bell className="w-4 h-4" />
                  <span>Send Rent Reminders</span>
                </button>
              </>
            ) : (
              <>
                {tenantPendingRent && (
                  <button
                    onClick={() => onOpenPayRent(tenantPendingRent)}
                    className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-400/30 transition-all flex items-center space-x-2 animate-bounce"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Rent: ₹{tenantPendingRent.totalAmount?.toLocaleString('en-IN')}</span>
                  </button>
                )}
                <button
                  onClick={onOpenReportDamage}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Report Damage</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Subtle decorative background circle */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
      </div>

      {/* Tenant Alert Banner if Rent is Due */}
      {!isAdmin && tenantPendingRent && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                  Monthly Rent Due
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Due on {tenantPendingRent.dueDate}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {tenantPendingRent.billingMonth} Rent is Payable: ₹{tenantPendingRent.totalAmount?.toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-slate-600">
                Includes Base Rent (₹{tenantPendingRent.baseRent?.toLocaleString('en-IN')}) and Society Maintenance (₹{tenantPendingRent.maintenanceCharges?.toLocaleString('en-IN')}).
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenPayRent(tenantPendingRent)}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all whitespace-nowrap"
          >
            <span>Pay Now via UPI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Collected Rent</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                ₹{totalRentCollected.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                <span>{paidInvoices.length} invoices cleared</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Rent</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-800">
                ₹{totalRentPending.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-amber-700 font-semibold">
                {unpaidInvoices.length} tenants pending
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Damage Claims</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {pendingDamages.length}
              </div>
              <p className="text-[11px] text-slate-500">
                Requires review / approval
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Agreements</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {agreements.length}
              </div>
              <p className="text-[11px] text-blue-700 font-semibold">
                {agreements.filter(a => a.status === 'executed').length} active executed
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Rent Due</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {tenantPendingRent ? `₹${tenantPendingRent.totalAmount?.toLocaleString('en-IN')}` : 'Paid (₹0)'}
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                {tenantPendingRent ? `Due by ${tenantPendingRent.dueDate}` : 'Up to date'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gov Meters</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {meters.length} Active
              </div>
              <p className="text-[11px] text-slate-500">
                BESCOM & BWSSB linked
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Utility Bills</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Droplets className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {unpaidUtilityBills.length} Unpaid
              </div>
              <p className="text-[11px] text-slate-500">
                Total: ₹{unpaidUtilityBills.reduce((a, b) => a + (b.amount || 0), 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Damage Claims</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {damages.length}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold">
                {damages.filter(d => d.status === 'reimbursed').length} reimbursed
              </p>
            </div>
          </>
        )}
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Agreements & Damage Reports */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Indian Rental Agreements */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Stamp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Official Rental Agreements</h3>
              </div>
              <button
                onClick={() => onNavigate('agreements')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
              >
                <span>View All ({agreements.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {agreements.map((agr) => (
                <div
                  key={agr.id}
                  onClick={() => onOpenAgreementViewer(agr)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{agr.unitNumber} • {agr.propertyName}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        agr.status === 'executed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {agr.status === 'executed' ? 'Executed' : 'Pending Signature'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Tenant: <strong>{agr.tenantName}</strong> (Aadhaar: <span className="font-mono text-emerald-800">{agr.tenantAadhaar}</span>)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      e-Stamp: {agr.stampCertificateNo} • ₹{agr.monthlyRent?.toLocaleString('en-IN')}/mo
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAgreementViewer(agr);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      View Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Damage & Repair Claims */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Damage Claims & Invoices</h3>
              </div>
              <button
                onClick={() => onNavigate('damages')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
              >
                <span>View All ({damages.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {damages.slice(0, 3).map((dmg) => (
                <div
                  key={dmg.id}
                  className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {dmg.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{dmg.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{dmg.description}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span>Reported by: <strong>{dmg.tenantName}</strong></span>
                      {dmg.invoice && <span>Invoice: <strong>{dmg.invoice.invoiceNumber}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1.5 flex-shrink-0">
                    <span className="text-sm font-black text-slate-900">₹{dmg.repairCost?.toLocaleString('en-IN')}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      dmg.status === 'reimbursed' ? 'bg-emerald-100 text-emerald-800' :
                      dmg.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      dmg.status === 'deducted_from_deposit' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {dmg.status.replace(/_/g, ' ')}
                    </span>
                    {dmg.invoice && (
                      <button
                        type="button"
                        onClick={() => onOpenViewInvoice && onOpenViewInvoice(dmg)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline mt-0.5"
                      >
                        View Invoice →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Government Meter Status & Recent Notifications */}
        <div className="space-y-6">
          
          {/* Government Meters Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Gov Allotted Meters</h3>
              </div>
              <button
                onClick={() => onNavigate('utilities')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {meters.slice(0, 3).map((meter) => (
                <div key={meter.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      {meter.meterType === 'electricity' ? (
                        <Zap className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Droplets className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-xs font-bold text-slate-800">
                        {meter.utilityProvider.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {meter.unitNumber}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Consumer ID:</span>
                    <span className="font-mono font-bold text-slate-900">{meter.consumerId}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Current Reading:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {meter.currentReading} {meter.meterType === 'electricity' ? 'kWh' : 'kL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In-App Notifications Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Notifications</h3>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length} unread
              </span>
            </div>

            <div className="space-y-3">
              {notifications.slice(0, 4).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                    !notif.read ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{notif.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
