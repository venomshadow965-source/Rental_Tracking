import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Stamp, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Printer, 
  Building, 
  User, 
  CreditCard,
  Fingerprint
} from 'lucide-react';

export default function AgreementsPage({
  agreements,
  currentUser,
  onOpenCreateAgreement,
  onOpenAgreementViewer
}) {
  const isAdmin = currentUser?.role === 'admin';
  const [filter, setFilter] = useState('all'); // all, executed, sent_to_tenant

  const filteredAgreements = agreements.filter(a => {
    if (filter === 'executed') return a.status === 'executed';
    if (filter === 'sent_to_tenant') return a.status === 'sent_to_tenant' || a.status === 'draft';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Stamp className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Indian Legal Rental Agreements
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Indian Stamp Act and Model Tenancy Act compliant lease contracts with verified Tenant Aadhaar details, registered government meters, stamp paper certificate numbers, and digital signatures.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenCreateAgreement}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Make New Rental Agreement</span>
          </button>
        )}
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
          All Agreements ({agreements.length})
        </button>
        <button
          onClick={() => setFilter('executed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === 'executed'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Fully Executed ({agreements.filter(a => a.status === 'executed').length})
        </button>
        <button
          onClick={() => setFilter('sent_to_tenant')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === 'sent_to_tenant'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Signatures ({agreements.filter(a => a.status !== 'executed').length})
        </button>
      </div>

      {/* Agreements List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAgreements.map((agreement) => {
          const isPendingTenant = !agreement.tenantSigned && currentUser?.id === agreement.tenantId;

          return (
            <div
              key={agreement.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {agreement.agreementNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {agreement.unitNumber} • {agreement.propertyName}
                    </h3>
                  </div>

                  <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    agreement.status === 'executed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}>
                    {agreement.status === 'executed' ? 'Executed' : 'Pending Tenant Signature'}
                  </span>
                </div>

                {/* Key Legal Details */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tenant Legal Name:</span>
                    <span className="font-bold text-slate-900">{agreement.tenantName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tenant Aadhaar Details:</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {agreement.tenantAadhaar}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Stamp Certificate:</span>
                    <span className="font-mono text-slate-700">{agreement.stampCertificateNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Monthly Rent:</span>
                    <span className="font-bold text-slate-900">₹{agreement.monthlyRent?.toLocaleString('en-IN')}/-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Security Deposit:</span>
                    <span className="font-bold text-slate-900">₹{agreement.securityDeposit?.toLocaleString('en-IN')}/-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dedicated Meters:</span>
                    <span className="text-[11px] text-slate-700 font-mono">
                      Elec: {agreement.electricityConsumerId || '88472910'} • Water: {agreement.waterConsumerId || 'BW-KOR-302'}
                    </span>
                  </div>
                </div>

                {/* Signatures status */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Lessor: Rajesh Sharma (Signed)</span>
                  </div>
                  <div className={`p-2 rounded-lg border flex items-center space-x-1.5 ${
                    agreement.tenantSigned
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    {agreement.tenantSigned ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Lessee: {agreement.tenantName} (Signed)</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Lessee: Signature Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Term: {agreement.termMonths} Months ({agreement.startDate} to {agreement.endDate})
                </span>

                <div className="flex items-center space-x-2">
                  {isPendingTenant && (
                    <button
                      onClick={() => onOpenAgreementViewer(agreement)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-1"
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>Sign Now</span>
                    </button>
                  )}
                  <button
                    onClick={() => onOpenAgreementViewer(agreement)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Legal Document</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
