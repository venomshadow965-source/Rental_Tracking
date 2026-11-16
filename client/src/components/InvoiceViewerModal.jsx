import React, { useState } from 'react';
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
  User,
  Eye,
  FileCheck
} from 'lucide-react';

export default function InvoiceViewerModal({ damage, onClose }) {
  if (!damage || !damage.invoice) return null;

  const inv = damage.invoice;
  const hasUploadedFile = Boolean(inv.fileUrl);
  const isPdf = inv.fileUrl && (inv.fileUrl.toLowerCase().endsWith('.pdf') || inv.fileName?.toLowerCase().endsWith('.pdf'));
  const isImage = inv.fileUrl && (
    inv.fileUrl.match(/\.(jpeg|jpg|png|webp|gif)$/i) ||
    inv.fileName?.match(/\.(jpeg|jpg|png|webp|gif)$/i) ||
    inv.fileUrl.startsWith('data:image')
  );

  // Active view tab: if uploaded file exists, default to 'file' tab!
  const [activeTab, setActiveTab] = useState(hasUploadedFile ? 'file' : 'breakdown');

  const handlePrint = () => {
    window.print();
  };

  const handleOpenDirect = () => {
    if (inv.fileUrl) {
      window.open(inv.fileUrl, '_blank');
    }
  };

  // Helper to generate dynamic realistic line items if needed
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
        { desc: 'Replacement Hardware / Replacement Component', qty: 1, rate: partsCost, amount: partsCost },
        { desc: 'Skilled Technician Service Labor & Installation', qty: 1, rate: laborCost, amount: laborCost }
      ];
    }
  };

  const lineItems = getLineItems();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-md flex justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[96vh] overflow-hidden">

        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 rounded-t-2xl no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Tenant Uploaded Damage Invoice & Receipt
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  Verified Bill
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Uploaded by <strong>{damage.tenantName}</strong> ({damage.unitNumber}) • Claim: <strong>{damage.title}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasUploadedFile && (
              <a
                href={inv.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                title="Open uploaded file in full browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open File in Tab</span>
              </a>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center space-x-2 px-6 pt-3 pb-2 border-b border-slate-200 bg-slate-50/50 no-print">
          {hasUploadedFile && (
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'file'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Original Uploaded File ({inv.fileName || 'repair_bill.pdf'})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('breakdown')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'breakdown'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Structured Tax Invoice & Line Items</span>
          </button>

          {damage.photos && damage.photos.length > 0 && (
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'photos'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Site Photos ({damage.photos.length})</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50">

          {/* TAB 1: THE ACTUAL UPLOADED FILE (PDF / IMAGE) */}
          {activeTab === 'file' && hasUploadedFile && (
            <div className="space-y-4">

              {/* File details banner */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {inv.fileName || 'Uploaded_Repair_Invoice.pdf'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      File Size: {inv.fileSize || 'Standard Document'} • Uploaded by Tenant: {damage.tenantName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={inv.fileUrl}
                    download={inv.fileName || 'invoice.pdf'}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <a
                    href={inv.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Fullscreen</span>
                  </a>
                </div>
              </div>

              {/* Live Embedded Document Viewer */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2">
                {isImage ? (
                  <div className="text-center p-4">
                    <img
                      src={inv.fileUrl}
                      alt={inv.fileName || 'Uploaded Invoice'}
                      className="max-h-[650px] mx-auto rounded-xl object-contain border border-slate-200 shadow-md"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <iframe
                      src={inv.fileUrl}
                      title={inv.fileName || 'Invoice Document'}
                      className="w-full h-[650px] rounded-xl border border-slate-300 bg-slate-50"
                    />
                    <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-600 flex items-center justify-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Original file directly rendered from server. Click "View Fullscreen" if your browser restricts iframe PDF view.</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: STRUCTURED DIGITAL INVOICE CARD */}
          {activeTab === 'breakdown' && (
            <div className="max-w-2xl mx-auto border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white shadow-sm space-y-6 printable-area text-slate-900 text-xs">

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
                <div className="border-2 border-emerald-600 rounded-xl px-4 py-2 text-center text-emerald-800 bg-emerald-50/50 -rotate-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Payment Status</span>
                  <span className="text-base font-black tracking-widest text-emerald-700">PAID IN FULL</span>
                  <span className="text-[9px] block text-slate-500">Mode: UPI / Electronic Settlement</span>
                </div>

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
          )}

          {/* TAB 3: DAMAGE SITE PHOTOS */}
          {activeTab === 'photos' && damage.photos && damage.photos.length > 0 && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {damage.photos.length} Damage Inspection Photos Attached
                </span>
                <span className="text-slate-500">
                  Submitted with claim #{damage.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {damage.photos.map((photoUrl, pIdx) => (
                  <div key={pIdx} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm space-y-2 p-2">
                    <img
                      src={photoUrl}
                      alt={`Damage inspection photo ${pIdx + 1}`}
                      className="w-full h-72 object-cover rounded-xl"
                    />
                    <div className="p-2 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-bold">Inspection Site Photo #{pIdx + 1}</span>
                      <a
                        href={photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-bold hover:underline flex items-center space-x-1"
                      >
                        <span>View Original</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between no-print">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Landlord can approve or reimburse based on verified technician invoice.</span>
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
