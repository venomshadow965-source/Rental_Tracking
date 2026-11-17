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
  ShieldCheck,
  RefreshCw,
  Landmark,
  ExternalLink,
  Flame,
  Activity
} from 'lucide-react';

export default function UtilitiesPage({
  meters = [],
  utilityBills = [],
  currentUser,
  onOpenRegisterMeter,
  onOpenAddReading,
  onOpenPayBill,
  onSyncMeter,
  onSyncAllMeters,
  onViewGovReceipt
}) {
  const [filterType, setFilterType] = useState('all'); // all, electricity, water, gas
  const [filterStatus, setFilterStatus] = useState('all'); // all, unpaid, paid
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingMeterId, setSyncingMeterId] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');

  // Filter bills
  const filteredBills = utilityBills.filter(b => {
    if (filterType !== 'all' && (b.meterType || '').toLowerCase() !== filterType) return false;
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
    if ((b.meterType || '').toLowerCase() === 'electricity') {
      monthlyAggregates[b.billingMonth].electricity += b.amount;
    } else {
      monthlyAggregates[b.billingMonth].water += b.amount;
    }
    monthlyAggregates[b.billingMonth].total += b.amount;
  });

  const monthList = Object.values(monthlyAggregates).reverse();

  // Handle Sync All Meters
  const handleSyncAll = async () => {
    setSyncingAll(true);
    setSyncMessage('');
    try {
      if (onSyncAllMeters) {
        const res = await onSyncAllMeters();
        setSyncMessage(res?.message || 'Live readings successfully fetched from government servers!');
        setTimeout(() => setSyncMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingAll(false);
    }
  };

  // Handle Single Meter Live Sync
  const handleSyncSingleMeter = async (meterId) => {
    setSyncingMeterId(meterId);
    try {
      if (onSyncMeter) {
        await onSyncMeter(meterId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingMeterId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Government Meters & Utility Tracking
                </h1>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>DISCOM Server Live</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
                Register government-allotted electricity (BESCOM/BSES) and water (BWSSB/DJB) meters, fetch live readings directly from DISCOM servers, and remit payments straight to government treasury via Bharat BillPay (BBPS).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs shadow-xs transition-all whitespace-nowrap disabled:opacity-50"
            title="Fetch real-time meter readings directly from DISCOM servers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            <span>{syncingAll ? 'Querying Gov Servers...' : 'Sync Live Gov Readings'}</span>
          </button>

          <button
            onClick={onOpenRegisterMeter}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Gov Meter</span>
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

      {/* Sync Success Alert Notification */}
      {syncMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* SECTION 1: REGISTERED GOVERNMENT METERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-emerald-600" />
            <span>Registered Government Meters ({meters.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Connected to NPCI / DISCOM Central Switch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meters.map((meter) => {
            const isElec = (meter.meterType || '').toLowerCase() === 'electricity';
            const isWater = (meter.meterType || '').toLowerCase() === 'water';
            const isSyncingThis = syncingMeterId === meter.id;

            return (
              <div
                key={meter.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-emerald-300 transition-all space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 ${
                  isElec ? 'bg-amber-500' : isWater ? 'bg-blue-500' : 'bg-orange-500'
                }`} />

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-xl ${
                        isElec ? 'bg-amber-100 text-amber-700' : isWater ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {isElec ? <Zap className="w-5 h-5" /> : isWater ? <Droplets className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {isElec ? 'Electricity Meter' : isWater ? 'Water Meter' : 'Piped Gas Meter'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {meter.utilityProvider}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                      {meter.unitNumber || 'Common Area'}
                    </span>
                  </div>

                  {/* Property Name */}
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Property: <strong className="text-slate-800">{meter.propertyName || 'Property'}</strong></span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200/60">
                      🟢 Live Server
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Consumer ID / CA:</span>
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
                      <span className="text-slate-500 font-sans">Resident:</span>
                      <span className="font-bold text-slate-700 font-sans">{meter.tenantName || 'Allotted Resident'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Live Reading</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      {meter.currentReading} {meter.unitOfMeasure || (isElec ? 'kWh' : 'kL')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSyncSingleMeter(meter.id)}
                    disabled={isSyncingThis}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
                    title="Query DISCOM server for current reading"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingThis ? 'animate-spin' : ''}`} />
                    <span>{isSyncingThis ? 'Syncing...' : 'Sync'}</span>
                  </button>
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
              <span className="text-slate-600 font-semibold">Electricity (BESCOM/BSES)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-600 font-semibold">Water (BWSSB/DJB)</span>
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
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900">
              Government Utility Bills & BBPS Remittance Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Payments settle directly into respective State Government Utility Treasury Accounts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs font-semibold py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Utility Types</option>
              <option value="electricity">Electricity Only</option>
              <option value="water">Water Only</option>
              <option value="gas">Gas (PNG) Only</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="paid">Paid to Gov Only</option>
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
                <th className="py-3 px-3">Gov Bill Amount (₹)</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Settlement Status</th>
                <th className="py-3 px-3 text-right">Government Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.map((bill) => {
                const isPaid = bill.status === 'paid';
                const isElec = (bill.meterType || '').toLowerCase() === 'electricity';
                const isWater = (bill.meterType || '').toLowerCase() === 'water';

                return (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {bill.billingMonth}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        {isElec ? (
                          <Zap className="w-3.5 h-3.5 text-amber-600" />
                        ) : isWater ? (
                          <Droplets className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Flame className="w-3.5 h-3.5 text-orange-600" />
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
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}>
                        {isPaid ? `Paid to Gov (${bill.provider})` : 'Unpaid to Gov'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!isPaid ? (
                        <button
                          onClick={() => onOpenPayBill(bill)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm shadow-emerald-600/20 whitespace-nowrap"
                        >
                          🏛️ Pay to Gov (BBPS)
                        </button>
                      ) : (
                        <button
                          onClick={() => onViewGovReceipt && onViewGovReceipt(bill)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors whitespace-nowrap inline-flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3 text-slate-600" />
                          <span>Gov BBPS Receipt</span>
                        </button>
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
