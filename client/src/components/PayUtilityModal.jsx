import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Zap, 
  Droplets, 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight,
  Smartphone
} from 'lucide-react';

export default function PayUtilityModal({ bill, onClose, onPaySuccess }) {
  const [paymentMode, setPaymentMode] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!bill) return null;

  const handlePay = async () => {
    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const ref = `BBPS/${bill.provider}/${Date.now().toString().slice(-8)}`;
      await onPaySuccess(bill.id, ref);
      setSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      alert('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${bill.meterType === 'electricity' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
              {bill.meterType === 'electricity' ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pay {bill.meterType === 'electricity' ? 'Electricity' : 'Water'} Bill
              </h3>
              <p className="text-xs text-slate-500">
                {bill.provider} • Consumer ID: {bill.consumerId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!success ? (
          <div className="p-6 space-y-5">
            {/* Amount Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md">
              <span className="text-[10px] uppercase font-bold text-slate-300">Total Bill Payable</span>
              <div className="text-3xl font-black text-emerald-400 mt-1">₹{bill.amount?.toLocaleString('en-IN')}</div>
              <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div>Billing Month: <span className="font-bold text-white">{bill.billingMonth}</span></div>
                <div>Units Consumed: <span className="font-bold text-white">{bill.unitsConsumed} {bill.meterType === 'electricity' ? 'kWh' : 'kL'}</span></div>
              </div>
            </div>

            {/* BBPS Gateway Simulator */}
            <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Bharat BillPay (BBPS) Direct Gateway
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Settles immediately with {bill.provider} discom server and updates your payment history ledger.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePay}
              disabled={processing}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing BBPS Payment...</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{bill.amount?.toLocaleString('en-IN')} via UPI / BBPS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Bill Paid Successfully!</h4>
            <p className="text-xs text-slate-500">
              Payment of ₹{bill.amount?.toLocaleString('en-IN')} confirmed by {bill.provider}.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Consumer ID:</span>
                <span className="font-bold">{bill.consumerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BBPS Ref ID:</span>
                <span className="font-mono font-bold">BBPS/{bill.provider}/{Date.now().toString().slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-700">PAID</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
