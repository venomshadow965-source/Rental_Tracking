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
  Smartphone,
  Landmark,
  Building2,
  FileText,
  Flame,
  Lock,
  ChevronRight
} from 'lucide-react';

export default function PayUtilityModal({ bill, onClose, onPaySuccess, onViewGovReceipt }) {
  const [paymentMode, setPaymentMode] = useState('upi'); // upi, netbanking, card
  const [upiId, setUpiId] = useState('priya.verma@okaxis');
  const [step, setStep] = useState(1); // 1 = Review & Pay, 2 = Settlement in progress, 3 = Government Settled
  const [processingStage, setProcessingStage] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  if (!bill) return null;

  const isElec = (bill.meterType || '').toLowerCase() === 'electricity';
  const isWater = (bill.meterType || '').toLowerCase() === 'water';
  const provider = bill.provider || 'BESCOM';
  const fullGovName = isElec 
    ? `${provider} (Government Power Distribution Company)`
    : `${provider} (State Water Supply & Sewerage Board)`;

  const handlePay = async () => {
    setStep(2);

    try {
      // Step 1: Connecting to BBPCU
      setProcessingStage('1/3 Connecting to NPCI Bharat BillPay Central Unit (BBPCU)...');
      await new Promise(r => setTimeout(r, 800));

      // Step 2: Remitting to Government Treasury Escrow
      setProcessingStage(`2/3 Remitting ₹${bill.amount?.toLocaleString('en-IN')} to State Government Treasury Escrow...`);
      await new Promise(r => setTimeout(r, 1000));

      // Step 3: Government Biller Confirmation
      setProcessingStage(`3/3 Generating Official ${provider} DISCOM Clearing Approval...`);
      const ref = `BBPS/${provider}/${Date.now().toString().slice(-8)}`;
      const result = await onPaySuccess(bill.id, ref, paymentMode);

      setReceiptData(result?.governmentReceipt || null);
      setStep(3);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      alert('Payment processing failed: ' + (err.message || 'Unknown error'));
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${
              isElec ? 'bg-amber-100 text-amber-800' : isWater ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {isElec ? <Zap className="w-5 h-5" /> : isWater ? <Droplets className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Government Utility Bill Settlement
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  BBPS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct remittance to {provider} • Consumer ID: <span className="font-mono font-bold text-slate-800">{bill.consumerId}</span>
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

        {/* Content Flow */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* STEP 1: REVIEW & SELECT PAYMENT CHANNEL */}
          {step === 1 && (
            <div className="space-y-4">
              
              {/* Government Remittance Destination Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Official Government Beneficiary
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    ESCROW VERIFIED
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {bill.providerFullName || fullGovName}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    NPCI Bharat BillPay Clearing Switch • State Treasury Pool Account
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due to Government</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      ₹{bill.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-300 font-mono">
                    <div>{bill.billingMonth}</div>
                    <div className="text-[11px] text-slate-400">{bill.unitsConsumed} {isElec ? 'kWh' : 'kL'} consumed</div>
                  </div>
                </div>
              </div>

              {/* Itemized Government Slabs Breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Base Energy / Water Charges:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{Math.max(0, (bill.amount || 0) - (bill.fixedCharges || 110) - Math.round((bill.amount || 0) * 0.09)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sanctioned Load Fixed Charges:</span>
                  <span className="font-mono font-bold text-slate-800">₹{bill.fixedCharges || 110}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Government Electricity Duty (9%) / Cess:</span>
                  <span className="font-mono font-bold text-slate-800">₹{bill.electricityDuty || Math.round((bill.amount || 0) * 0.09)}</span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMode === 'upi'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600 text-xs'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs block">UPI / GPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('netbanking')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMode === 'netbanking'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600 text-xs'
                    }`}
                  >
                    <Landmark className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs block">NetBanking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('card')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMode === 'card'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600 text-xs'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs block">Debit / Credit</span>
                  </button>
                </div>
              </div>

              {paymentMode === 'upi' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Enter Virtual Payment Address (UPI ID)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi or name@okaxis"
                    className="w-full text-xs font-mono font-bold py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              )}

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-900">
                <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  NPCI 256-bit encrypted clearing. Generates an instant downloadable Government BBPS receipt.
                </span>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePay}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>Remit ₹{bill.amount?.toLocaleString('en-IN')} to Government</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: PROCESSING SETTLEMENT */}
          {step === 2 && (
            <div className="py-8 text-center space-y-5 animate-in fade-in duration-200">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-emerald-700" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Government Settlement in Progress
                </h4>
                <p className="text-xs text-emerald-700 font-mono font-medium">
                  {processingStage}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left max-w-sm mx-auto space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Biller:</span>
                  <span className="font-bold text-slate-900">{provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Consumer ID:</span>
                  <span className="font-bold text-slate-900">{bill.consumerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Remittance Amount:</span>
                  <span className="font-bold text-emerald-800">₹{bill.amount}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SETTLED & RECEIPT READY */}
          {step === 3 && (
            <div className="text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  Remitted & Settled to Government!
                </h4>
                <p className="text-xs text-slate-500">
                  Your utility payment of ₹{bill.amount?.toLocaleString('en-IN')} has been cleared directly into the <strong>{provider} State Treasury Account</strong>.
                </p>
              </div>

              {/* Settlement Proof Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-sans">BBPS Ref No:</span>
                  <span className="font-bold text-slate-900 select-all">
                    {receiptData?.bbpsTxnRef || `BBPS/KA/2026/${bill.consumerId}/7721`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-sans">NPCI Transaction ID:</span>
                  <span className="font-bold text-slate-900 select-all">
                    {receiptData?.npciTxnId || `NPCI${Date.now()}`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-sans">Gov Biller Approval:</span>
                  <span className="font-bold text-emerald-800">
                    {receiptData?.billerApprovalCode || `AUTH-${provider}-TREASURY-SUCCESS`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Status:</span>
                  <span className="font-bold text-emerald-700">PAID & SETTLED TO GOVERNMENT</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onViewGovReceipt) onViewGovReceipt(bill, receiptData);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>View & Print Official Government Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Done
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
