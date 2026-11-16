import React, { useState } from 'react';
import { 
  Zap, 
  Droplets, 
  Plus, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Calendar, 
  Gauge, 
  FileText,
  Calculator,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export default function UtilitiesPage({
  meters,
  utilityBills,
  currentUser,
  onOpenRegisterMeter,
  onOpenAddReading,
  onOpenPayBill
}) {
  const [filterType, setFilterType] = useState('all'); // all, electricity, water
  const [filterStatus, setFilterStatus] = useState('all'); // all, unpaid, paid

  // Filter bills
  const filteredBills = utilityBills.filter(b => {
    if (filterType !== 'all' && b.meterType !== filterType) return false;
    if (filterStatus === 'unpaid' && b.status !== 'unpaid') return false;
    if (filterStatus === 'paid' && b.status !== 'paid') return false;
    return true;
  });

  // Calculate monthly stats for analytics
  const unpaidCount = utilityBills.filter(b => b.status === 'unpaid').length;
  const unpaidTotal = utilityBills.filter(b => b.status === 'unpaid').reduce((a, b) => a + (b.amount || 0), 0);

  // Group bills by month for monthly cost history trend
  const monthlyAggregates = {};
  utilityBills.forEach(b => {
    if (!monthlyAggregates[b.billingMonth]) {
      monthlyAggregates[b.billingMonth] = { month: b.billingMonth, electricity: 0, water: 0, total: 0 };
    }
    if (b.meterType === 'electricity') {
      monthlyAggregates[b.billingMonth].electricity += b.amount;
    } else {
      monthlyAggregates[b.billingMonth].water += b.amount;
    }
    monthlyAggregates[b.billingMonth].total += b.amount;
  });

  const monthList = Object.values(monthlyAggregates).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Government Meters & Utility Tracking
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Register government-allotted electricity (BESCOM/BSES) and water (BWSSB/DJB) meters, record monthly readings, pay bills instantly via BBPS/UPI, and monitor monthly cost history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenRegisterMeter}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Register Gov Meter</span>
          </button>
          <button
            onClick={onOpenAddReading}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap"
          >
            <Calculator className="w-4 h-4" />
            <span>Record Monthly Reading</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: REGISTERED GOVERNMENT METERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-emerald-600" />
            <span>Registered Government Meters ({meters.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Official DISCOM & Water Board records</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meters.map((meter) => {
            const isElec = meter.meterType === 'electricity';

            return (
              <div
                key={meter.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-emerald-300 transition-all space-y-3 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 ${
                  isElec ? 'bg-amber-500' : 'bg-blue-500'
                }`} />

                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-xl ${
                      isElec ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isElec ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {isElec ? 'Electricity Meter' : 'Water Meter'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {meter.utilityProvider}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                    {meter.unitNumber}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Consumer ID / CA No:</span>
                    <span className="font-bold text-slate-900">{meter.consumerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Meter Serial No:</span>
                    <span className="font-bold text-slate-900">{meter.meterNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Sanctioned Load:</span>
                    <span className="font-bold text-slate-700">{meter.sanctionedLoad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Initial Reading:</span>
                    <span className="text-slate-600">{meter.initialReading} {isElec ? 'kWh' : 'kL'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Reading</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      {meter.currentReading} {isElec ? 'kWh' : 'kL'}
                    </span>
                  </div>

                  <span className="text-[11px] text-emerald-800 bg-emerald-50 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    Active & Linked
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: MONTHLY COST HISTORY & TRENDS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Monthly Utility Cost History & Consumption Trends</span>
            </h3>
            <p className="text-xs text-slate-500">
              Track whether paid or unpaid and total cost per month across electricity and water
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-600 font-semibold">Electricity (BESCOM)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-600 font-semibold">Water (BWSSB)</span>
            </div>
          </div>
        </div>

        {/* Visual Monthly Cost Comparison Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {monthList.map((m) => (
            <div key={m.month} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{m.month}</span>
                <span className="text-xs font-black text-emerald-800">₹{m.total?.toLocaleString('en-IN')}</span>
              </div>

              {/* Progress split bar */}
              <div className="h-2.5 w-full bg-slate-200 rounded-full flex overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all" 
                  style={{ width: `${m.total > 0 ? (m.electricity / m.total) * 100 : 50}%` }}
                  title={`Electricity: ₹${m.electricity}`}
                />
                <div 
                  className="bg-blue-500 h-full transition-all" 
                  style={{ width: `${m.total > 0 ? (m.water / m.total) * 100 : 50}%` }}
                  title={`Water: ₹${m.water}`}
                />
              </div>

              <div className="grid grid-cols-2 text-[10px] text-slate-500 pt-0.5">
                <div>⚡ ₹{m.electricity}</div>
                <div className="text-right">💧 ₹{m.water}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: DETAILED MONTHLY BILLS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        
        {/* Table Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            Monthly Utility Bills & Payment Ledger
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs font-semibold py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Utility Types</option>
              <option value="electricity">Electricity Only</option>
              <option value="water">Water Only</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Billing Month</th>
                <th className="py-3 px-3">Type & Board</th>
                <th className="py-3 px-3">Consumer ID</th>
                <th className="py-3 px-3">Prev / Current</th>
                <th className="py-3 px-3">Units Consumed</th>
                <th className="py-3 px-3">Total Cost (₹)</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Payment Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.map((bill) => {
                const isPaid = bill.status === 'paid';
                const isElec = bill.meterType === 'electricity';

                return (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {bill.billingMonth}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        {isElec ? (
                          <Zap className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Droplets className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span className="font-semibold">{bill.provider}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {bill.consumerId}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {bill.previousReading} → {bill.currentReading}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {bill.unitsConsumed} {isElec ? 'kWh' : 'kL'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900 text-sm">
                      ₹{bill.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {bill.dueDate}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}>
                        {isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!isPaid ? (
                        <button
                          onClick={() => onOpenPayBill(bill)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm shadow-emerald-600/20"
                        >
                          Pay Bill
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {bill.paymentRef?.slice(0, 15) || 'Cleared'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
