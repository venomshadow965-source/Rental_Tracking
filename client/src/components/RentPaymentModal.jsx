import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  CreditCard, 
  QrCode, 
  Building, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight,
  Smartphone
} from 'lucide-react';

export default function RentPaymentModal({ 
  invoice, 
  onClose, 
  onPaySuccess 
}) {
  const [paymentMode, setPaymentMode] = useState('upi'); // upi, netbanking, card
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paidReceipt, setPaidReceipt] = useState(null);

  if (!invoice) return null;

  const landlordUpi = "rajesh.landlord@okhdfcbank";

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(landlordUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleExecutePayment = async () => {
    setProcessing(true);
    try {
      // Simulate gateway authorization delay
      await new Promise(r => setTimeout(r, 1200));

      const methodLabel = paymentMode === 'upi' 
        ? `UPI (${selectedUpiApp.toUpperCase()})` 
        : paymentMode === 'netbanking' 
        ? `Net Banking (${selectedBank})` 
        : 'Credit/Debit Card';
        
      const txnRef = `UPI/${Date.now().toString().slice(-8)}/KIRAYAPAY`;

      const res = await onPaySuccess(invoice.id, methodLabel, txnRef);
      setPaidReceipt(res?.invoice || invoice);
      setPaymentSuccess(true);

      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      alert('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {paymentSuccess ? 'Rent Payment Receipt' : 'Pay Monthly Rent'}
              </h3>
              <p className="text-xs text-slate-500">
                {invoice.unitNumber} • {invoice.billingMonth}
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
        {!paymentSuccess ? (
          <div className="p-6 space-y-5">
            
            {/* Amount Banner */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-lg shadow-emerald-600/20">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-emerald-100 uppercase tracking-wider font-semibold">Total Amount Due</span>
                  <div className="text-3xl font-black mt-1">₹{invoice.totalAmount?.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-200 block">Due Date</span>
                  <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
                    {invoice.dueDate}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/20 text-xs text-emerald-100">
                <div>Base Rent: <span className="font-bold text-white">₹{invoice.baseRent?.toLocaleString('en-IN')}</span></div>
                <div>Maintenance: <span className="font-bold text-white">₹{invoice.maintenanceCharges?.toLocaleString('en-IN')}</span></div>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('upi')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMode === 'upi'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 font-semibold'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs">Instant UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('netbanking')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMode === 'netbanking'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 font-semibold'
                  }`}
                >
                  <Building className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs">Net Banking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('card')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMode === 'card'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 font-semibold'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs">Cards</span>
                </button>
              </div>
            </div>

            {/* UPI Option Detail */}
            {paymentMode === 'upi' && (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Landlord UPI VPA</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                      {landlordUpi}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="p-1 text-slate-500 hover:text-emerald-600"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-center space-y-1">
                    {/* Simulated SVG QR Code */}
                    <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
                      <rect width="100" height="100" fill="white" />
                      {/* Corner squares */}
                      <rect x="10" y="10" width="25" height="25" fill="#047857" />
                      <rect x="15" y="15" width="15" height="15" fill="white" />
                      <rect x="19" y="19" width="7" height="7" fill="#047857" />

                      <rect x="65" y="10" width="25" height="25" fill="#047857" />
                      <rect x="70" y="15" width="15" height="15" fill="white" />
                      <rect x="74" y="19" width="7" height="7" fill="#047857" />

                      <rect x="10" y="65" width="25" height="25" fill="#047857" />
                      <rect x="15" y="70" width="15" height="15" fill="white" />
                      <rect x="19" y="74" width="7" height="7" fill="#047857" />

                      {/* Random QR dots */}
                      <rect x="42" y="12" width="5" height="5" fill="#0f172a" />
                      <rect x="52" y="22" width="5" height="5" fill="#0f172a" />
                      <rect x="45" y="45" width="10" height="10" fill="#047857" />
                      <rect x="65" y="45" width="6" height="6" fill="#0f172a" />
                      <rect x="75" y="55" width="5" height="5" fill="#0f172a" />
                      <rect x="45" y="65" width="5" height="8" fill="#0f172a" />
                      <rect x="65" y="75" width="8" height="5" fill="#0f172a" />
                      <rect x="80" y="80" width="8" height="8" fill="#0f172a" />
                    </svg>
                    <p className="text-[11px] font-bold text-slate-700">Scan via Any UPI App</p>
                    <p className="text-[10px] text-slate-400">Google Pay • PhonePe • Paytm • BHIM</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { id: 'gpay', label: 'GPay' },
                    { id: 'phonepe', label: 'PhonePe' },
                    { id: 'paytm', label: 'Paytm' },
                    { id: 'bhim', label: 'BHIM' }
                  ].map(app => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg border text-center transition-colors ${
                        selectedUpiApp === app.id
                          ? 'border-emerald-600 bg-emerald-100 text-emerald-800'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Net Banking Option */}
            {paymentMode === 'netbanking' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <label className="block font-bold text-slate-700">Select Bank</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option>HDFC Bank</option>
                  <option>State Bank of India (SBI)</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  You will be redirected to {selectedBank} secure payment gateway to authenticate.
                </p>
              </div>
            )}

            {/* Card Option */}
            {paymentMode === 'card' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    defaultValue="4532 9982 1029 4432"
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      defaultValue="08/29"
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      defaultValue="882"
                      maxLength={3}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white text-center font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleExecutePayment}
              disabled={processing}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{invoice.totalAmount?.toLocaleString('en-IN')} Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulated 256-Bit SSL Encrypted Indian Payment Gateway</span>
            </div>

          </div>
        ) : (
          /* Payment Success & Instant Receipt */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                Payment Confirmed
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">
                ₹{invoice.totalAmount?.toLocaleString('en-IN')} Paid Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Receipt #{paidReceipt?.receiptNumber || 'RCT-2026-11-302'} generated
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant:</span>
                <span className="font-bold text-slate-800">{invoice.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit:</span>
                <span className="font-bold text-slate-800">{invoice.unitNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Period:</span>
                <span className="font-bold text-slate-800">{invoice.billingMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800">{paidReceipt?.transactionRef || 'UPI/VERIFIED'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Landlord PAN:</span>
                <span className="font-mono font-bold text-slate-800">{invoice.landlordPan || 'ABCPS1234F'}</span>
              </div>
            </div>

            <p className="text-xs text-emerald-700 font-semibold">
              ✓ An in-app payment confirmation notification has been sent to your account and landlord Rajesh Sharma.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Done & Return to Payments
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
