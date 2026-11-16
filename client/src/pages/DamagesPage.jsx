import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  Image as ImageIcon,
  ShieldCheck,
  User,
  Building
} from 'lucide-react';

export default function DamagesPage({
  damages,
  currentUser,
  onOpenReportDamage,
  onOpenReviewDamage
}) {
  const isAdmin = currentUser?.role === 'admin';
  const [filter, setFilter] = useState('all'); // all, under_review, reimbursed, approved

  const filteredDamages = damages.filter(d => {
    if (filter === 'under_review') return d.status === 'under_review';
    if (filter === 'reimbursed') return d.status === 'reimbursed';
    if (filter === 'approved') return d.status === 'approved';
    return true;
  });

  const totalRepairCost = damages.reduce((acc, curr) => acc + (curr.repairCost || 0), 0);
  const reimbursedCost = damages
    .filter(d => d.status === 'reimbursed')
    .reduce((acc, curr) => acc + (curr.repairCost || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Damage Claims & Repair Invoices
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Tenants can report property damages, specify repair costs, attach technician invoices and receipts, and track landlord reimbursement or deposit adjustment status.
          </p>
        </div>

        <button
          onClick={onOpenReportDamage}
          className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Report Damage & Add Invoice</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Claims</span>
          <div className="text-xl font-black text-slate-900">{damages.length}</div>
          <p className="text-[10px] text-slate-500">Incurred repair claims</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Repair Cost</span>
          <div className="text-xl font-black text-slate-900">₹{totalRepairCost.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-slate-500">Cumulative expenses</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Reimbursed to Tenants</span>
          <div className="text-xl font-black text-emerald-700">₹{reimbursedCost.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-emerald-600 font-semibold">Credited via UPI</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Pending Review</span>
          <div className="text-xl font-black text-amber-700">
            {damages.filter(d => d.status === 'under_review').length}
          </div>
          <p className="text-[10px] text-amber-600 font-semibold">Awaiting action</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Claims ({damages.length})
        </button>
        <button
          onClick={() => setFilter('under_review')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === 'under_review'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Under Review ({damages.filter(d => d.status === 'under_review').length})
        </button>
        <button
          onClick={() => setFilter('reimbursed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === 'reimbursed'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Reimbursed ({damages.filter(d => d.status === 'reimbursed').length})
        </button>
      </div>

      {/* Damage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDamages.map((dmg) => {
          return (
            <div
              key={dmg.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {dmg.category}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-rose-700 bg-rose-50 border border-rose-200">
                        {dmg.severity || 'Medium'} Severity
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{dmg.title}</h3>
                  </div>

                  <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    dmg.status === 'reimbursed' ? 'bg-emerald-100 text-emerald-800' :
                    dmg.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    dmg.status === 'deducted_from_deposit' ? 'bg-amber-100 text-amber-800' :
                    dmg.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-700 animate-pulse'
                  }`}>
                    {dmg.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {dmg.description}
                </p>

                {/* Attached Invoice Box */}
                {dmg.invoice ? (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-900">{dmg.invoice.vendorName}</span>
                      </div>
                      <span className="font-mono text-emerald-800 font-bold">₹{dmg.invoice.amount?.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="grid grid-cols-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                      <span>Bill No: {dmg.invoice.invoiceNumber}</span>
                      <span className="text-right">Dated: {dmg.invoice.invoiceDate}</span>
                    </div>
                    {dmg.invoice.vendorGstin && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        GSTIN: {dmg.invoice.vendorGstin}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                    No vendor invoice attached
                  </div>
                )}

                {/* Admin Review Note if any */}
                {dmg.adminReview && dmg.adminReview.notes && (
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Landlord Review Note:
                      </span>
                      {dmg.adminReview.reimbursedAt && (
                        <span className="text-[10px] text-emerald-700 font-mono">
                          Reimbursed on {new Date(dmg.adminReview.reimbursedAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-[11px]">{dmg.adminReview.notes}</p>
                    {dmg.adminReview.transactionRef && (
                      <div className="text-[10px] font-mono font-bold text-emerald-900 pt-0.5">
                        Txn Ref: {dmg.adminReview.transactionRef}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Repair Cost</span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{dmg.repairCost?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <button
                      onClick={() => onOpenReviewDamage(dmg)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
                    >
                      Review & Settle
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
