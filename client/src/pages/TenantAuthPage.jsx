import React, { useState } from 'react';
import { 
  UserCheck, 
  Lock, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  CreditCard,
  Building,
  Fingerprint,
  AlertCircle
} from 'lucide-react';
import { api, setSavedToken, setSavedUserId } from '../services/api';

export default function TenantAuthPage({ 
  onLoginSuccess, 
  onBackToLanding, 
  onSwitchToLandlord,
  units = []
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('priya.verma@gmail.com');
  const [password, setPassword] = useState('password123');

  // Register Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || 'unit_302');
  const [permanentAddress, setPermanentAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Aadhaar auto formatting
  const handleAadhaarChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += '-';
      formatted += val[i];
    }
    setAadhaar(formatted);
  };

  // Demo 1-Click quick fill
  const fillDemoTenant = (emailVal) => {
    setIsRegister(false);
    setIdentifier(emailVal);
    setPassword('password123');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login(identifier, password, 'tenant');
      if (res.success) {
        setSavedToken(res.token);
        setSavedUserId(res.user.id);
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !regPassword || !phone || !aadhaar) {
      setError('Please provide Name, Email, Phone, Password, and 12-digit Aadhaar Number.');
      return;
    }

    const cleanAadhaar = aadhaar.replace(/-/g, '');
    if (cleanAadhaar.length !== 12) {
      setError('Aadhaar number must contain exactly 12 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.register({
        portalType: 'tenant',
        name,
        email,
        phone,
        password: regPassword,
        aadhaar,
        pan,
        unitId: selectedUnitId,
        permanentAddress
      });

      if (res.success) {
        setSavedToken(res.token);
        setSavedUserId(res.user.id);
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur py-4 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToLanding}
            className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Select Different Portal</span>
          </button>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Are you a property owner?</span>
            <button
              onClick={onSwitchToLandlord}
              className="text-amber-400 hover:text-amber-300 font-bold underline"
            >
              Go to Landlord Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-md w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center">
        
        <div className="bg-slate-800/90 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          {/* Heading */}
          <div className="space-y-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-md">
              <UserCheck className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <span>Tenant Resident Portal</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              {isRegister ? 'Resident Registration' : 'Tenant Resident Login'}
            </h2>
            <p className="text-xs text-slate-400">
              {isRegister 
                ? 'Join your leased unit with verified Aadhaar tenancy'
                : 'Sign in to pay rent, view utility meters & report damages'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Demo Tenant Accounts Box */}
          {!isRegister && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px] uppercase tracking-wider">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Tenant Accounts</span>
                </span>
                <span className="text-[10px] text-slate-400">Click to autofill:</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoTenant('priya.verma@gmail.com')}
                  className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-left transition-colors"
                >
                  <p className="font-bold text-white text-[11px]">Priya Verma</p>
                  <p className="text-[10px] text-emerald-400">Flat 302 (Rent Due)</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoTenant('amit.patel@techcorp.com')}
                  className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-left transition-colors"
                >
                  <p className="font-bold text-white text-[11px]">Amit Patel</p>
                  <p className="text-[10px] text-emerald-400">Flat 104 (Sign Agr)</p>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          {!isRegister ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Email, Mobile, or Tenant ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="priya.verma@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating Tenant...' : 'Sign In to Resident Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Full Name (as per Aadhaar) *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Verma"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tenant@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-emerald-400 mb-1 flex items-center justify-between">
                  <span>Aadhaar Number (12 Digits) *</span>
                  <span className="text-[10px] font-mono text-slate-400">XXXX-XXXX-XXXX</span>
                </label>
                <div className="relative">
                  <Fingerprint className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={aadhaar}
                    onChange={handleAadhaarChange}
                    placeholder="5432-8765-9876"
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl py-2 pl-9 pr-3 text-white font-mono font-bold tracking-wider focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">PAN Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="BRIPV4321E"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white uppercase font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Select Leased Unit</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.propertyName} • {u.number} ({u.type}) - ₹{u.rent?.toLocaleString('en-IN')}/mo (Owner: {u.landlordName || 'Achyuta Bidarahalli'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Create Password *</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Creating Tenant Account...' : 'Complete Resident Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Toggle Login / Register */}
          <div className="text-center pt-2 border-t border-slate-700/60 text-xs">
            {!isRegister ? (
              <p className="text-slate-400">
                New tenant in this building?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline"
                >
                  Register Resident Account
                </button>
              </p>
            ) : (
              <p className="text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Strict Authorization: Landlords cannot authenticate through this Tenant portal.</span>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>KirayaSetu Tenant Resident Authorization Gateway</p>
      </footer>

    </div>
  );
}
