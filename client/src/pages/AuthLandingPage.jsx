import React from 'react';
import { 
  Building2, 
  UserCheck, 
  ArrowRight, 
  ShieldCheck, 
  Stamp, 
  CreditCard, 
  Zap, 
  AlertTriangle,
  FileCheck2,
  Lock
} from 'lucide-react';

export default function AuthLandingPage({ onSelectPortal }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur py-4 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight">KirayaSetu</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  India
                </span>
              </div>
              <p className="text-xs text-slate-400">Rent, Agreement & Utility Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Role-Based Secured Authentication</span>
          </div>
        </div>
      </header>

      {/* Hero & Portal Selection */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center">
        
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Dedicated Multi-Role Authentication</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Select Your Login Portal
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Separate portals and authorization gateways for Property Owners (Landlords) and Residents (Tenants). Choose your role below to proceed.
          </p>
        </div>

        {/* The Two Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          
          {/* PORTAL 1: LANDLORD / PROPERTY MANAGER */}
          <div 
            onClick={() => onSelectPortal('landlord')}
            className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-3xl p-8 border-2 border-slate-700/80 hover:border-amber-500/80 transition-all duration-300 shadow-2xl hover:shadow-amber-500/10 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                  Admin Access
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  Landlord & Owner Portal
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  Dedicated console for property owners to manage residential units, draft legal agreements, and oversee rent collections.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Stamp className="w-4 h-4 text-amber-400" />
                  <span>Draft Indian e-Stamp Rental Agreements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Review & Reimburse Damage Invoices</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Broadcast Rent Due Alerts & Reminders</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all group-hover:translate-x-0.5"
              >
                <span>Enter Landlord Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PORTAL 2: TENANT RESIDENT PORTAL */}
          <div 
            onClick={() => onSelectPortal('tenant')}
            className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-3xl p-8 border-2 border-slate-700/80 hover:border-emerald-500/80 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  Resident Access
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Tenant Resident Portal
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  Personalized tenant account to pay monthly rent via UPI, sign agreements digitally via Aadhaar, and track government meters.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Instant Rent Payment via UPI & HRA Receipts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>Aadhaar e-Sign Digital Signature</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Register Government Meters (BESCOM / BWSSB)</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all group-hover:translate-x-0.5"
              >
                <span>Enter Tenant Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>KirayaSetu • Role-Separated Tenancy & Property Management Infrastructure</p>
      </footer>

    </div>
  );
}
