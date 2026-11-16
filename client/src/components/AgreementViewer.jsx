import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  User, 
  CreditCard, 
  Calendar, 
  Building, 
  Zap, 
  Droplets,
  Fingerprint,
  Stamp,
  Award
} from 'lucide-react';

export default function AgreementViewer({ 
  agreement, 
  currentUser, 
  onClose, 
  onSignAgreement 
}) {
  const [signing, setSigning] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  if (!agreement) return null;

  const isTenantOfAgreement = currentUser?.id === agreement.tenantId;
  const canSign = isTenantOfAgreement && !agreement.tenantSigned;

  const handleOpenSignModal = () => {
    setShowOtpModal(true);
    setAadhaarOtp('458912'); // auto-fill sample OTP for convenience
  };

  const handleConfirmSignature = async () => {
    if (aadhaarOtp.length < 6) {
      setOtpError('Please enter a valid 6-digit Aadhaar OTP');
      return;
    }
    setSigning(true);
    try {
      await onSignAgreement(agreement.id, `AADHAAR_OTP_VERIFIED_${agreement.tenantAadhaar.slice(-4)}`);
      setShowOtpModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[95vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Indian Residential Rental Agreement
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-800">
                  {agreement.agreementNumber}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  agreement.status === 'executed' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {agreement.status === 'executed' ? 'Executed & Signed' : 'Pending Tenant Signature'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Standard Indian Stamp Paper & Model Tenancy Compliant Format
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

        {/* Modal Scrollable Content (Printable Legal Document) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white printable-area text-slate-900 text-sm leading-relaxed">
          
          {/* E-STAMP PAPER HEADER */}
          <div className="border-4 border-double border-amber-900/40 rounded-xl p-5 mb-8 bg-amber-50/20 text-slate-900">
            <div className="text-center pb-4 border-b border-amber-900/20">
              <div className="inline-flex items-center justify-center space-x-2 text-amber-900 font-serif font-black tracking-widest text-lg sm:text-xl uppercase">
                <Award className="w-6 h-6 text-amber-800" />
                <span>{agreement.stampIssueState || 'Government of Karnataka'}</span>
              </div>
              <p className="text-xs font-serif uppercase tracking-wider text-amber-800/80 mt-0.5">
                e-Stamp Certificate of Stamp Duty
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-amber-900/20">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Certificate No.</span>
                <span className="font-mono font-bold text-slate-800">{agreement.stampCertificateNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Stamp Duty Paid</span>
                <span className="font-bold text-emerald-800">₹{agreement.stampDutyAmount || 500}/-</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">First Party (Lessor)</span>
                <span className="font-bold text-slate-800">{agreement.landlordName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Second Party (Lessee)</span>
                <span className="font-bold text-slate-800">{agreement.tenantName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-amber-900/80 font-serif">
              <span>Description: Article 12 Residential Lease Agreement</span>
              <span>Issued for: {agreement.unitNumber}, {agreement.propertyName}</span>
            </div>
          </div>

          {/* MAIN AGREEMENT TITLE */}
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl font-serif font-bold uppercase tracking-wider text-slate-900">
              Residential Rental Agreement
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              (Under the Indian Contract Act, 1872 & Transfer of Property Act, 1882)
            </p>
          </div>

          {/* PREAMBLE */}
          <p className="mb-4 text-justify">
            This <strong>RENTAL / LEASE AGREEMENT</strong> is made and executed on this <strong>{new Date(agreement.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>, at Bengaluru, Karnataka, by and between:
          </p>

          {/* PARTIES */}
          <div className="space-y-4 mb-6">
            {/* Landlord */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    First Party / LESSOR (Landlord / Owner)
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1.5">{agreement.landlordName}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Son / Daughter of: <strong>{agreement.landlordFatherName}</strong>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Permanent Address: {agreement.landlordAddress}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Landlord Aadhaar</span>
                  <span className="font-mono font-bold text-slate-800">{agreement.landlordAadhaar}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Landlord PAN</span>
                  <span className="font-mono font-bold text-slate-800">{agreement.landlordPan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact Mobile</span>
                  <span className="font-semibold text-slate-800">{agreement.landlordPhone}</span>
                </div>
              </div>
            </div>

            <div className="text-center font-serif italic text-xs text-slate-500">
              — IN FAVOUR OF —
            </div>

            {/* Tenant */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/30">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Second Party / LESSEE (Tenant)
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1.5">{agreement.tenantName}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Son / Daughter of: <strong>{agreement.tenantFatherName}</strong>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Permanent Address: {agreement.tenantPermanentAddress}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">Tenant Aadhaar Number</span>
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                    {agreement.tenantAadhaar}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tenant PAN</span>
                  <span className="font-mono font-bold text-slate-800">{agreement.tenantPan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tenant Mobile</span>
                  <span className="font-semibold text-slate-800">{agreement.tenantPhone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SCHEDULE OF DEMISED PREMISES */}
          <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Schedule of Demised Premises</span>
            </h4>
            <p className="text-xs text-slate-800 leading-relaxed">
              All that piece and parcel of residential premises bearing <strong>{agreement.propertyAddress}</strong>, along with electrical fittings, ceiling fans, sanitaryware, and fixtures in sound working condition.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center space-x-1 text-slate-700">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Dedicated Electricity CA/Meter: <strong>{agreement.electricityConsumerId || '88472910'}</strong></span>
              </div>
              <div className="flex items-center space-x-1 text-slate-700">
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
                <span>Dedicated Water Consumer ID: <strong>{agreement.waterConsumerId || 'BW-KOR-302'}</strong></span>
              </div>
            </div>
          </div>

          {/* TERMS & CLAUSES */}
          <div className="space-y-3.5 text-xs text-justify">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1">
              Terms and Conditions of Tenancy
            </h4>

            <div>
              <strong>1. TERM OF LEASE:</strong> The Lessor hereby agrees to grant lease of the scheduled premises to the Lessee for a period of <strong>{agreement.termMonths || 11} Months</strong>, commencing from <strong>{agreement.startDate}</strong> and expiring on <strong>{agreement.endDate}</strong>.
            </div>

            <div>
              <strong>2. MONTHLY RENT:</strong> The monthly rent agreed upon by both parties is <strong>₹{agreement.monthlyRent?.toLocaleString('en-IN')}/- ({agreement.monthlyRentInWords})</strong>. The rent shall be paid by the Lessee to the Lessor on or before the <strong>{agreement.rentDueDateDay || 5}th day</strong> of each English calendar month through UPI, Bank Transfer or Cheque.
            </div>

            <div>
              <strong>3. INTEREST-FREE REFUNDABLE SECURITY DEPOSIT:</strong> The Lessee has paid an interest-free refundable security deposit of <strong>₹{agreement.securityDeposit?.toLocaleString('en-IN')}/- ({agreement.securityDepositInWords})</strong> to the Lessor. This deposit shall be refunded in full by the Lessor to the Lessee at the time of vacating and handing over vacant peaceful physical possession of the premises, after deducting any pending utility bills, unpaid rent, or damage to the property beyond normal wear and tear.
            </div>

            <div>
              <strong>4. MAINTENANCE CHARGES:</strong> The monthly society/association maintenance charges of <strong>₹{agreement.maintenanceCharges?.toLocaleString('en-IN') || 0}/-</strong> shall be borne by the Lessee and remitted directly to the Residents Welfare Association (RWA).
            </div>

            <div>
              <strong>5. ELECTRICITY & WATER CHARGES (GOVERNMENT METERS):</strong> The Lessee shall be exclusively responsible for paying monthly electricity bills to the power board (BESCOM/BSES) and water bills to the water sewerage board (BWSSB/DJB) according to the consumption recorded on the dedicated government allotted meters installed for the premises (Electricity Consumer No: <strong>{agreement.electricityConsumerId || '88472910'}</strong>, Water Consumer ID: <strong>{agreement.waterConsumerId || 'BW-KOR-302'}</strong>).
            </div>

            <div>
              <strong>6. PERMITTED RESIDENTIAL USE & SUB-LETTING:</strong> The premises shall be used exclusively for residential purposes by the Lessee and their immediate family. The Lessee shall not sub-let, assign, transfer, or part with possession of the premises to any third party under any circumstances.
            </div>

            <div>
              <strong>7. REPAIRS & DAMAGE POLICY:</strong> The Lessee agrees to keep the premises in clean and habitable condition. Any damage to sanitary fittings, glass panes, electric switches, or appliances caused by the negligence or act of the Lessee shall be reported promptly and repaired at the cost of the Lessee. In case of repairs carried out with valid invoices, reimbursement or adjustment shall be subject to Lessor's approval. Major structural faults and concealed pipeline defects shall be rectified by the Lessor.
            </div>

            <div>
              <strong>8. LOCK-IN PERIOD & NOTICE PERIOD:</strong> Both parties agree to a lock-in period of <strong>{agreement.lockInPeriodMonths || 3} Months</strong>. After the lock-in period, either party may terminate this agreement by serving <strong>{agreement.noticePeriodMonths || 1} Month's prior written notice</strong> or rent in lieu thereof.
            </div>

            <div>
              <strong>9. RENEWAL & RENT ESCALATION:</strong> If mutually agreed to renew the tenancy upon expiration of 11 months, the monthly rent shall be subject to an escalation of <strong>{agreement.annualEscalationPercent || 5}%</strong> over the prevailing rent.
            </div>

            <div>
              <strong>10. JURISDICTION:</strong> In the event of any dispute arising out of this agreement, it shall be subject to the exclusive jurisdiction of the competent civil courts situated at <strong>Bengaluru, Karnataka</strong>.
            </div>
          </div>

          {/* WITNESSES SECTION */}
          <div className="mt-8 pt-6 border-t border-slate-300">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Witnesses to this Agreement
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Witness 1</span>
                <p className="font-bold text-slate-900 mt-0.5">{agreement.witness1Name || 'Vikram Rao'}</p>
                <p className="text-slate-600 text-[11px]">{agreement.witness1Address || 'HSR Layout, Bengaluru'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Witness 2</span>
                <p className="font-bold text-slate-900 mt-0.5">{agreement.witness2Name || 'Ananya Gupta'}</p>
                <p className="text-slate-600 text-[11px]">{agreement.witness2Address || 'Indiranagar, Bengaluru'}</p>
              </div>
            </div>
          </div>

          {/* SIGNATURES BLOCK */}
          <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Landlord Signature */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between h-44">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">LESSOR / Landlord Signature</span>
                <p className="font-bold text-slate-900 text-sm mt-1">{agreement.landlordName}</p>
                <p className="text-[11px] text-slate-500">PAN: {agreement.landlordPan}</p>
              </div>
              
              <div className="pt-2 border-t border-slate-200">
                {agreement.landlordSigned ? (
                  <div className="flex items-center space-x-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold font-mono">DIGITALLY SIGNED BY LESSOR</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(agreement.landlordSignedAt || agreement.startDate).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-amber-700 font-medium">Pending Landlord Signature</span>
                )}
              </div>
            </div>

            {/* Tenant Signature */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 flex flex-col justify-between h-44">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800">LESSEE / Tenant Signature</span>
                <p className="font-bold text-slate-900 text-sm mt-1">{agreement.tenantName}</p>
                <p className="text-[11px] text-slate-500">Aadhaar: {agreement.tenantAadhaar}</p>
              </div>

              <div className="pt-2 border-t border-emerald-200">
                {agreement.tenantSigned ? (
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold font-mono">DIGITALLY SIGNED VIA AADHAAR e-SIGN</p>
                      <p className="text-[10px] text-slate-600">
                        Verified OTP: {agreement.tenantSignedAt ? new Date(agreement.tenantSignedAt).toLocaleString('en-IN') : 'Completed'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {canSign ? (
                      <button
                        onClick={handleOpenSignModal}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <Fingerprint className="w-4 h-4" />
                        <span>Sign via Aadhaar e-Sign OTP</span>
                      </button>
                    ) : (
                      <span className="text-xs text-amber-800 font-medium">Awaiting Tenant Digital Signature</span>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between no-print">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Legally binding digital agreement recorded with timestamp and Aadhaar reference.</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {canSign && (
              <button
                onClick={handleOpenSignModal}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Sign Agreement</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Aadhaar e-Sign OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Aadhaar e-Sign Verification</h4>
                <p className="text-xs text-slate-500">Simulating UIDAI OTP authentication</p>
              </div>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <p>Signer Name: <strong>{agreement.tenantName}</strong></p>
                <p>Aadhaar Number: <strong>{agreement.tenantAadhaar}</strong></p>
                <p className="text-emerald-700 font-semibold">An OTP has been sent to your registered mobile {agreement.tenantPhone}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Enter 6-Digit Aadhaar OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={aadhaarOtp}
                  onChange={(e) => {
                    setAadhaarOtp(e.target.value);
                    setOtpError('');
                  }}
                  placeholder="e.g. 458912"
                  className="w-full tracking-widest text-center text-lg font-mono font-bold py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {otpError && <p className="text-xs text-rose-600 mt-1">{otpError}</p>}
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Demo default code <strong>458912</strong> is pre-filled for convenience.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-1/2 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignature}
                disabled={signing}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {signing ? 'Verifying & Signing...' : 'Verify & Sign'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
