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
  Fingerprint, 
  UserCheck, 
  ArrowRight, 
  MapPin,
  Zap
} from 'lucide-react';

export default function AgreementsPage({
  agreements = [],
  currentUser,
  users = [],
  properties = [],
  invoices = [],
  onOpenCreateAgreement,
  onOpenAgreementViewer,
  onOpenMap,
  onOpenPayRent,
  onVacateUnit
}) {
  const isAdmin = currentUser?.role === 'admin';
  const [filter, setFilter] = useState('all'); // all, executed, sent_to_tenant
  const tenants = users.filter(u => u.role === 'tenant');

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
            onClick={() => onOpenCreateAgreement()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Make New Rental Agreement</span>
          </button>
        )}
      </div>

      {/* Landlord Console: Registered Tenants & Direct Make Agreement Section */}
      {isAdmin && tenants.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registered Tenants & Agreement Actions
                </h3>
                <p className="text-xs text-slate-500">
                  Select any newly registered or existing tenant to draft their official e-Stamp agreement with verified Aadhaar
                </p>
              </div>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full self-start sm:self-auto">
              {tenants.length} Registered Tenants
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {tenants.map(tenant => {
              const agreement = agreements.find(a => a.tenantId === tenant.id);
              const hasExecuted = agreement?.status === 'executed';
              const hasPending = agreement && agreement.status !== 'executed';

              return (
                <div 
                  key={tenant.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/70 hover:bg-emerald-50/30 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{tenant.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{tenant.unitNumber} • {tenant.propertyName}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        hasExecuted ? 'bg-emerald-100 text-emerald-800' :
                        hasPending ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {hasExecuted ? 'Active Contract' : hasPending ? 'Pending Sign' : 'Needs Agreement'}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-600 space-y-0.5 pt-1.5 border-t border-slate-200/80">
                      <div>Aadhaar: <span className="font-bold text-emerald-900">{tenant.aadhaar}</span></div>
                      <div>Phone: {tenant.phone}</div>
                      {(() => {
                        const unpaidInv = (invoices || []).find(inv => inv.tenantId === tenant.id && inv.status === 'unpaid');
                        if (unpaidInv) {
                          return (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                ⚠️ Rent Unpaid: ₹{unpaidInv.totalAmount?.toLocaleString('en-IN')}
                              </span>
                              {!isAdmin && onOpenPayRent && (
                                <button
                                  type="button"
                                  onClick={() => onOpenPayRent(unpaidInv)}
                                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
                                >
                                  <Zap className="w-3 h-3 text-amber-500 fill-current" />
                                  <span>Pay Rent ⚡</span>
                                </button>
                              )}
                            </div>
                          );
                        }
                        const paidInv = (invoices || []).find(inv => inv.tenantId === tenant.id && inv.status === 'paid');
                        if (paidInv) {
                          return (
                            <div className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1 pt-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Rent Paid (November 2026)</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                    {agreement ? (
                      <button
                        type="button"
                        onClick={() => onOpenAgreementViewer(agreement)}
                        className="text-xs text-slate-700 hover:text-emerald-700 font-bold flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Contract</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No contract yet</span>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenCreateAgreement(tenant.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                        hasExecuted 
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{hasExecuted ? 'Renew Agreement' : 'Make Agreement'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                    <span>Lessor: {agreement.landlordName || 'Rajesh Sharma'} (Signed)</span>
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
                  {onOpenMap && (
                    <button
                      type="button"
                      onClick={() => {
                        const prop = properties?.find(p => p.id === agreement.propertyId || p.name === agreement.propertyName) || {
                          name: agreement.propertyName,
                          address: agreement.propertyAddress,
                          city: 'Bengaluru',
                          state: 'Karnataka',
                          latitude: agreement.latitude || 12.9345,
                          longitude: agreement.longitude || 77.6221,
                          landmarks: agreement.landmarks || ['Sony World Signal (350m)', 'Koramangala 80ft Road (200m)'],
                          googleMapsUrl: agreement.googleMapsUrl,
                          directionsUrl: agreement.directionsUrl
                        };
                        onOpenMap(prop);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors"
                      title="View leased property location on interactive map"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Map</span>
                    </button>
                  )}
                  {/* Pay Rent if Unpaid */}
                  {(() => {
                    const unpaidInv = (invoices || []).find(inv => inv.tenantId === agreement.tenantId && inv.status === 'unpaid');
                    if (unpaidInv) {
                      if (!isAdmin && onOpenPayRent) {
                        return (
                          <button
                            type="button"
                            onClick={() => onOpenPayRent(unpaidInv)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-200 fill-current" />
                            <span>Pay Rent (₹{unpaidInv.totalAmount?.toLocaleString('en-IN')}) ⚡</span>
                          </button>
                        );
                      } else if (isAdmin) {
                        return (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold">
                            Rent Unpaid (₹{unpaidInv.totalAmount?.toLocaleString('en-IN')})
                          </span>
                        );
                      }
                    }
                    return null;
                  })()}

                  {/* Mark Vacant Button for Landlord */}
                  {isAdmin && onVacateUnit && agreement.status !== 'terminated' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to mark ${agreement.unitNumber} as VACANT and end this agreement? The unit will become available for new agreements.`)) {
                          await onVacateUnit(agreement.unitId);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-200 transition-colors cursor-pointer"
                      title="Release and vacate unit for new agreements"
                    >
                      <span>Mark Vacant</span>
                    </button>
                  )}

                  {isPendingTenant && (
                    <button
                      onClick={() => onOpenAgreementViewer(agreement)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-1 cursor-pointer"
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>Sign Now</span>
                    </button>
                  )}
                  <button
                    onClick={() => onOpenAgreementViewer(agreement)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
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
