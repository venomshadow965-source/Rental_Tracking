import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  FileText, 
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function ReviewDamageModal({ 
  damage, 
  onClose, 
  onReviewSubmit,
  onOpenViewInvoice
}) {
  const [status, setStatus] = useState('approved');
  const [notes, setNotes] = useState('Approved by landlord. Legitimate repair expense.');
  const [transactionRef, setTransactionRef] = useState(`UPI/${Date.now()}/REIMBURSE`);
  const [loading, setLoading] = useState(false);

  if (!damage) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onReviewSubmit(damage.id, {
        status,
        notes,
        transactionRef: status === 'reimbursed' ? transactionRef : null
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Review Damage & Repair Invoice
              </h3>
              <p className="text-xs text-slate-500">
                Claim submitted by {damage.tenantName} ({damage.unitNumber})
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Claim Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  {damage.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{damage.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{damage.description}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Repair Cost</span>
                <span className="text-lg font-black text-emerald-700">₹{damage.repairCost?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Attached Invoice */}
            {damage.invoice && (
              <div className="mt-3 pt-3 border-t border-slate-200 bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-800">{damage.invoice.vendorName}</span>
                      <span className="text-slate-400 text-[11px] block">Inv: {damage.invoice.invoiceNumber} • ₹{damage.invoice.amount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenViewInvoice && onOpenViewInvoice(damage)}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1.5 transition-colors"
                  >
                    <span>View Full Invoice & Photos</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Decision */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Action & Approval Decision
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatus('approved');
                  setNotes('Approved by landlord. Reimbursement scheduled.');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'approved'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Approve Claim</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Accept as valid landlord repair expense</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('reimbursed');
                  setNotes('Amount credited directly to tenant account via UPI.');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'reimbursed'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Mark Reimbursed</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Credit ₹{damage.repairCost} via UPI</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('deducted_from_deposit');
                  setNotes('Damage caused by tenant. Deducted from security deposit.');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'deducted_from_deposit'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Deduct from Deposit</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Hold tenant liable for repair</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('rejected');
                  setNotes('Claim rejected: Issue falls under tenant routine consumables/wear.');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'rejected'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold ring-1 ring-rose-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject Claim</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Disapprove with explanation</p>
              </button>
            </div>
          </div>

          {/* Transaction Ref if reimbursed */}
          {status === 'reimbursed' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UPI / Bank Transfer Transaction Reference
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="UPI/261015998124/HDFC"
                className="w-full text-xs font-mono font-bold py-2 px-3 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          )}

          {/* Landlord Note to Tenant */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Note to Tenant ({damage.tenantName})
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Save Decision & Notify Tenant'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
