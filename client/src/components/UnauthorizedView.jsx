import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';

export default function UnauthorizedView({ 
  requiredRole = 'Landlord Administrator',
  currentRole = 'Tenant',
  onBackToDashboard,
  onLogout 
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border-2 border-rose-200 p-8 sm:p-10 max-w-lg w-full text-center shadow-xl space-y-6">
        
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
            403 • Authorization Forbidden
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            This module requires <strong>{requiredRole}</strong> authorization privileges. 
            Your current logged-in role is <strong>{currentRole}</strong>.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 text-left space-y-1 font-mono">
          <div>Policy Check: <span className="text-rose-600 font-bold">FAILED</span></div>
          <div>Enforced Boundary: Role-Based Access Control (RBAC)</div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full sm:w-auto px-5 py-2.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch / Re-login</span>
          </button>
        </div>

      </div>
    </div>
  );
}
