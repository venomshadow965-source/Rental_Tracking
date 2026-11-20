import React from 'react';
import { X, Printer, Download, Stamp, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function HraReceiptModal({ invoice, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl no-print">
          <div className="flex items-center space-x-2">
            <Stamp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Official HRA Rent Receipt (Sec 10(13A))
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable HRA Receipt */}
        <div className="p-8 sm:p-12 overflow-y-auto printable-area bg-white text-slate-900">
          
          <div className="border-4 border-emerald-800/30 p-8 rounded-2xl relative bg-emerald-50/10">
            {/* Header */}
            <div className="text-center pb-6 border-b-2 border-slate-200">
              <h2 className="text-xl sm:text-2xl font-serif font-black uppercase tracking-wider text-slate-900">
                Official Rent Receipt
              </h2>
              <p className="text-xs font-semibold text-emerald-800 mt-1 uppercase tracking-wide">
                Under Section 10(13A) of Income Tax Act, 1961 for HRA Exemption
              </p>
            </div>

            {/* Receipt Number & Date */}
            <div className="flex items-center justify-between py-4 text-xs border-b border-slate-200">
              <div>
                <span className="text-slate-500 uppercase text-[10px] block font-bold">Receipt Number</span>
                <span className="font-mono font-bold text-slate-800">{invoice.receiptNumber || `RCT-${invoice.id.slice(-6)}`}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 uppercase text-[10px] block font-bold">Payment Date</span>
                <span className="font-semibold text-slate-800">
                  {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '04 October 2026'}
                </span>
              </div>
            </div>

            {/* Main Receipt Body */}
            <div className="py-6 space-y-4 text-sm leading-relaxed">
              <p>
                Received with thanks from <strong>{invoice.tenantName}</strong> a sum of <strong>₹{invoice.totalAmount?.toLocaleString('en-IN')}/-</strong> via <strong>{invoice.paymentMethod || 'UPI / Bank Transfer'}</strong> (Txn Ref: <span className="font-mono text-xs">{invoice.transactionRef || 'UPI/VERIFIED'}</span>).
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Rent Period:</span>
                  <span className="font-bold text-slate-900">{invoice.billingMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Property Address:</span>
                  <span className="font-bold text-slate-900 text-right">{invoice.unitNumber}, {invoice.propertyName || 'Palm Heights Apartments, Koramangala, Bengaluru'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Rent:</span>
                  <span className="font-bold text-slate-900">₹{invoice.baseRent?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Society Maintenance:</span>
                  <span className="font-bold text-slate-900">₹{invoice.maintenanceCharges?.toLocaleString('en-IN')}</span>
                </div>
                {(invoice.landlordSettlement || invoice.upiDetails) && (
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-600">Settled to Landlord A/c:</span>
                    <span className="font-bold text-emerald-800 text-right">
                      {invoice.landlordSettlement?.bankName || invoice.upiDetails?.settlementBank || 'State Bank of India (SBI)'} ({invoice.landlordSettlement?.maskedAccountNumber || '•••• 8056'}) • IFSC: {invoice.landlordSettlement?.ifsc || 'SBIN0011821'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Landlord Sign & Revenue Stamp */}
            <div className="mt-8 pt-6 border-t-2 border-slate-200 flex items-end justify-between">
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold">Landlord / House Owner</span>
                <p className="font-bold text-slate-900 text-base mt-0.5">
                  {invoice.landlordName || invoice.landlordSettlement?.name || 'Achyuta Bidarahalli'}
                </p>
                <div className="mt-1">
                  <span className="text-xs text-slate-500">Landlord PAN: </span>
                  <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    {invoice.landlordPan || invoice.landlordSettlement?.pan || 'ABCPS1234F'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">(Mandatory for HRA claims &gt; ₹1,00,000/yr)</p>
              </div>

              {/* Indian Revenue Stamp Graphic */}
              <div className="relative w-28 h-32 border-2 border-dashed border-rose-400 bg-rose-50/50 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                <div className="border border-rose-400 w-full h-full rounded flex flex-col items-center justify-between p-1 bg-rose-100/40">
                  <span className="text-[9px] font-bold uppercase text-rose-800 tracking-wider">Revenue</span>
                  <div className="text-xs font-black text-rose-900">₹ 1</div>
                  <span className="text-[8px] uppercase text-rose-800">India</span>
                </div>
                {/* Diagonal Signature across stamp */}
                <div className="absolute inset-0 flex items-center justify-center -rotate-12 pointer-events-none">
                  <span className="font-serif italic font-bold text-blue-900 text-sm tracking-wide border-b-2 border-blue-900 pb-0.5">
                    {invoice.landlordName || invoice.landlordSettlement?.name || 'Achyuta Bidarahalli'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              Generated via KirayaSetu Indian Tenancy Portal • Verified digital receipt valid for Income Tax HRA declaration.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
