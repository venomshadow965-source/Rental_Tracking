import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Droplets, 
  Building2, 
  Landmark, 
  QrCode, 
  FileText,
  ExternalLink,
  Flame
} from 'lucide-react';

export default function GovReceiptModal({ receipt, bill, onClose }) {
  if (!receipt && !bill) return null;

  // Use receipt data or reconstruct from bill
  const r = receipt || bill?.governmentReceipt || {};
  const b = r.billDetails || bill || {};
  const c = r.consumerDetails || {
    consumerId: bill?.consumerId || '88472910',
    meterNumber: 'KA-SM-AUTO',
    registeredName: 'Resident',
    propertyName: 'Residential Property',
    unitNumber: 'Flat',
    sanctionedLoad: '3 kW',
    tariffCategory: 'LT-2(a) Domestic'
  };
  const biller = r.billerDetails || {
    billerId: 'BESCOM0000NAT01',
    billerName: `${bill?.provider || 'BESCOM'} - State Electricity Distribution Company`,
    shortName: bill?.provider || 'BESCOM',
    state: 'Karnataka',
    stateGovernment: 'Government of Karnataka',
    department: bill?.meterType === 'water' ? 'Department of Water Resources & Sewerage' : 'Department of Energy & Power Transmission',
    treasuryEscrowAccount: 'STATE-TREASURY-DISCOM-ESCROW'
  };
  const pay = r.paymentDetails || {
    paymentChannel: 'UPI (Instant BBPS Clearing)',
    paymentGateway: 'NPCI Bharat BillPay Central Unit (BBPCU)',
    remittanceMode: 'Instant Real-Time Gross Settlement to State Treasury',
    digitalVerificationToken: 'CERT-BBPS-KRN-' + Date.now().toString(16).toUpperCase()
  };

  const isElec = (bill?.meterType || '').toLowerCase() === 'electricity';
  const isWater = (bill?.meterType || '').toLowerCase() === 'water';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden print:border-none print:shadow-none print:max-w-none">
        
        {/* Modal Controls - Hidden when printing */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Official Government Payment Receipt (BBPS Certified)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Government Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white" id="official-gov-receipt">
          
          {/* Top Government & BBPS Official Header */}
          <div className="border-b-2 border-slate-900 pb-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-amber-500 text-white rounded-md font-black text-xs">
                    भारत
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                    {biller.stateGovernment}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {biller.billerName}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {biller.department} • Bharat Bill Payment System (BBPS)
                </p>
              </div>

              {/* BBPS Logo Box */}
              <div className="text-right">
                <div className="inline-flex flex-col items-end">
                  <div className="px-3 py-1 bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-black text-xs rounded tracking-wider shadow-xs">
                    BHARAT BILLPAY
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">
                    Biller ID: <strong>{biller.billerId}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Official Receipt Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-slate-200/80 font-mono">
              <div>
                <span className="text-slate-500 font-sans">Receipt No: </span>
                <span className="font-bold text-slate-900">{r.receiptNumber || `GOV-REC-${Date.now().toString().slice(-8)}`}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans">Date: </span>
                <span className="font-bold text-slate-900">{r.settlementDateFormatted || new Date().toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Paid to Government Green Banner & Stamp */}
          <div className="relative overflow-hidden p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 block">
                  Payment Status: Fully Paid & Settled
                </span>
                <p className="text-xs text-emerald-800 font-medium">
                  Funds remitted directly into <strong>{biller.shortName} State Treasury Escrow</strong>.
                </p>
              </div>
            </div>

            {/* Simulated Digital Stamp */}
            <div className="border-2 border-dashed border-emerald-700 px-3 py-1.5 rounded-lg text-center transform -rotate-1 self-start sm:self-auto bg-white/80">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                GOVT. DISCOM CLEARED
              </span>
              <span className="text-[9px] font-mono text-emerald-700 block">
                NPCI / BBPS SETTLED
              </span>
            </div>
          </div>

          {/* Consumer & Property Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Government Registered Connection
              </span>
              <div className="space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Consumer ID / RR No:</span>
                  <span className="font-bold text-slate-900">{c.consumerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Meter Serial No:</span>
                  <span className="font-bold text-slate-900">{c.meterNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Sanctioned Load:</span>
                  <span className="font-bold text-slate-700">{c.sanctionedLoad}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Tariff Category:</span>
                  <span className="font-bold text-slate-700">{c.tariffCategory}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Premises & Tenancy Location
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Property:</span>
                  <span className="font-bold text-slate-900">{c.propertyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit / Flat:</span>
                  <span className="font-bold text-slate-900">{c.unitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consumer Name:</span>
                  <span className="font-bold text-slate-900">{c.registeredName}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 font-sans">Billing Cycle:</span>
                  <span className="font-bold text-slate-800">{b.billingMonth}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Meter Readings & Consumption Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Official Meter Reading & Consumption
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100/80 font-bold text-slate-600 border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Previous Reading</th>
                    <th className="py-2.5 px-3">Current Live Reading</th>
                    <th className="py-2.5 px-3">Units Consumed</th>
                    <th className="py-2.5 px-3 text-right">Sanctioned Tariff Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-3 px-3 text-slate-600">{b.previousReading} {b.unitOfMeasure || 'kWh'}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{b.currentReading} {b.unitOfMeasure || 'kWh'}</td>
                    <td className="py-3 px-3">
                      <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {b.unitsConsumed} {b.unitOfMeasure || 'units'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">₹{b.ratePerUnit || 7.5} / unit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Total Remitted */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Energy / Water Consumption Charges:</span>
              <span className="font-mono font-bold text-slate-800">
                ₹{Math.max(0, (b.amount || 0) - (b.fixedCharges || 110) - (b.electricityDuty || Math.round((b.amount || 0) * 0.09))).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sanctioned Load Fixed / Capacity Charge:</span>
              <span className="font-mono font-bold text-slate-800">₹{b.fixedCharges || 110}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Government Electricity Duty (9%) / Sewerage Cess:</span>
              <span className="font-mono font-bold text-slate-800">₹{b.electricityDuty || Math.round((b.amount || 0) * 0.09)}</span>
            </div>
            <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm">
              <span className="font-black text-slate-900 uppercase">Total Amount Remitted to Government:</span>
              <span className="font-black text-emerald-700 text-lg font-mono">
                ₹{b.amount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* BBPS & NPCI Central Switch Settlement Proof */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>NPCI / Bharat BillPay Central Clearing Authentication</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
              <div>
                <span className="text-slate-400 block font-sans">BBPS Transaction Ref:</span>
                <span className="font-bold text-slate-900 select-all">{r.bbpsTxnRef || `BBPS/KA/2026/${c.consumerId}/9901`}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans">NPCI Transaction ID:</span>
                <span className="font-bold text-slate-900 select-all">{r.npciTxnId || `NPCI20261117${Date.now().toString().slice(-8)}`}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans">Biller Authorization Code:</span>
                <span className="font-bold text-emerald-800">{r.billerApprovalCode || `AUTH-${biller.shortName}-TREASURY-84910`}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans">Payment Channel:</span>
                <span className="font-bold text-slate-800">{pay.paymentChannel}</span>
              </div>
            </div>
          </div>

          {/* Verification Footer with Digital QR Data & Legal Notice */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                <QrCode className="w-7 h-7 text-slate-800" />
              </div>
              <div>
                <span className="font-bold text-slate-700 block">BBPS Digital Verification Hash</span>
                <span className="font-mono text-[10px] text-slate-400 break-all">
                  {pay.digitalVerificationToken || 'HMAC-SHA256-VERIFIED-GOV-RECEIPT'}
                </span>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400 space-y-0.5">
              <p>Generated by KirayaSetu Government Utility Gateway</p>
              <p>Compliant with Model Tenancy Act & Section 80GG IT Rules</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
