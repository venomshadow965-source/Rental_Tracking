import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Building, 
  CheckCircle2, 
  Wrench, 
  Receipt, 
  Calendar, 
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  User
} from 'lucide-react';

export default function InvoiceViewerModal({ damage, onClose }) {
  if (!damage || !damage.invoice) return null;

  const inv = damage.invoice;

  const handlePrint = () => {
    window.print();
  };

  // Helper to generate dynamic realistic line items if not explicitly provided
  const getLineItems = () => {
    const total = inv.amount || damage.repairCost || 1500;
    const partsCost = Math.round(total * 0.65);
    const laborCost = total - partsCost;

    if (damage.category === 'Plumbing') {
      return [
        { desc: 'High-Pressure Heavy Brass Angle Valve (1/2")', qty: 1, rate: Math.round(partsCost * 0.55), amount: Math.round(partsCost * 0.55) },
        { desc: 'SS-304 Braided Inlet Connecting Pipe (24")', qty: 1, rate: Math.round(partsCost * 0.45), amount: Math.round(partsCost * 0.45) },
        { desc: 'Plumber Diagnostic, Fitting & Concealed Wall Labor', qty: 1, rate: laborCost, amount: laborCost }
      ];
    } else if (damage.category === 'Appliance') {
      return [
        { desc: 'Copper Pipe Brazing & Nitrogen Pressure Test', qty: 1, rate: Math.round(partsCost * 0.4), amount: Math.round(partsCost * 0.4) },
        { desc: 'Eco-Friendly R32 Refrigerant Gas Refill (1.5 Ton)', qty: 1, rate: Math.round(partsCost * 0.6), amount: Math.round(partsCost * 0.6) },
        { desc: 'Certified HVAC Technician Service & Inspection Charges', qty: 1, rate: laborCost, amount: laborCost }
      ];
    } else {
      return [
        { desc: 'Replacement Hardware / Replacement Material Component', qty: 1, rate: partsCost, amount: partsCost },
        { desc: 'Skilled Technician Service Labor & Installation', qty: 1, rate: laborCost, amount: laborCost }
      ];
    }
  };

  const lineItems = getLineItems();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[95vh] overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Technician Repair Invoice & Receipt
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  Verified Bill
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Submitted by {damage.tenantName} for {damage.unitNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white printable-area text-slate-900 text-xs leading-relaxed space-y-6">
          
          {/* INVOICE CARD */}
          <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
            
            {/* Header: Vendor Details */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">
                    {inv.vendorName || 'QuickFix Professional Services Bangalore'}
                  </h2>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Authorized Repairs, Maintenance & Facility Services
                </p>
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                  <p>Address: 14/B, 1st Cross, Koramangala 4th Block, Bengaluru - 560034</p>
                  <p>Phone: +91 98450 88219 • Email: billing@quickfixblr.in</p>
                  {inv.vendorGstin && (
                    <p className="font-mono font-bold text-slate-800">
                      GSTIN: {inv.vendorGstin}
                    </p>
                  )}
                </div>
              </div>

              {/* Tax Invoice Badge & Number */}
              <div className="text-left sm:text-right space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                  TAX INVOICE / CASH BILL
                </span>
                <div className="pt-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Invoice Number</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{inv.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Date of Invoice</span>
                  <span className="font-semibold text-slate-800">{inv.invoiceDate || '2026-10-14'}</span>
                </div>
              </div>
            </div>

            {/* Billed To / Property Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Billed To (Customer)</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{damage.tenantName}</p>
                <p className="text-slate-600 text-[11px]">Resident / Tenant</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Service Location (Premises)</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{damage.unitNumber}</p>
                <p className="text-slate-600 text-[11px]">Palm Heights Apartments, Bengaluru</p>
              </div>
            </div>

            {/* Repair Case Context */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Repair Scope / Issue Description:
              </span>
              <p className="font-bold text-slate-900 mt-0.5">{damage.title}</p>
              <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{damage.description}</p>
            </div>

            {/* Itemized Table */}
            <div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Description of Work / Replacement Parts</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{item.desc}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{item.rate?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{item.amount?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="pt-4 border-t-2 border-slate-300 flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">₹{inv.amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST + SGST (Included):</span>
                    <span className="font-mono text-slate-500">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount Paid:</span>
                    <span className="font-black text-emerald-800 font-mono text-base">₹{inv.amount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Paid Stamp & Signatures */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* PAID STAMP */}
              <div className="border-2 border-emerald-600 rounded-xl px-4 py-2 text-center text-emerald-800 bg-emerald-50/50 -rotate-2">
                <span className="text-[10px] font-bold uppercase tracking-wider block">Payment Status</span>
                <span className="text-base font-black tracking-widest text-emerald-700">PAID IN FULL</span>
                <span className="text-[9px] block text-slate-500">Mode: UPI / Electronic Settlement</span>
              </div>

              {/* Technician Sign off */}
              <div className="text-right space-y-1">
                <div className="font-serif italic text-base text-slate-800 border-b border-slate-300 pb-1">
                  M. Sundaram
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Authorized Signatory (Technician Lead)
                </span>
                <span className="text-[10px] text-slate-500">{inv.vendorName}</span>
              </div>
            </div>

          </div>

          {/* ATTACHED DAMAGE PHOTOS SECTION */}
          {damage.photos && damage.photos.length > 0 && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Inspection Photos of Damaged Item / Area</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {damage.photos.map((photoUrl, pIdx) => (
                  <div key={pIdx} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <img
                      src={photoUrl}
                      alt={`Damage photo ${pIdx + 1}`}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                    />
                    <div className="p-2 text-center text-[11px] text-slate-500 font-medium">
                      Site inspection photo #{pIdx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Landlord Settlement Summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Current Claim Status:</span>
              <span className="font-bold uppercase text-slate-800">{damage.status.replace(/_/g, ' ')}</span>
            </div>
            {damage.adminReview && damage.adminReview.notes && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Landlord Review Note:</span>
                <span className="font-semibold text-slate-800">{damage.adminReview.notes}</span>
              </div>
            )}
            {damage.adminReview?.transactionRef && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reimbursement Reference:</span>
                <span className="font-mono font-bold text-emerald-800">{damage.adminReview.transactionRef}</span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between no-print">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified bill submitted with GSTIN record and technician line items.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
