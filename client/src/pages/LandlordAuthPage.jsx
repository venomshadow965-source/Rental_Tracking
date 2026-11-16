import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  CreditCard, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  Stamp,
  Sparkles,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { api, setSavedToken, setSavedUserId } from '../services/api';

export default function LandlordAuthPage({ 
  onLoginSuccess, 
  onBackToLanding, 
  onSwitchToTenant 
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('rajesh.landlord@kirayasetu.in');
  const [password, setPassword] = useState('password123');

  // Register Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1-Click Demo Quick Fill
  const fillDemoLandlord = () => {
    setIsRegister(false);
    setIdentifier('rajesh.landlord@kirayasetu.in');
    setPassword('password123');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login(identifier, password, 'landlord');
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
    if (!name || !email || !regPassword || !phone) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.register({
        portalType: 'landlord',
        name,
        email,
        phone,
        password: regPassword,
        pan,
        aadhaar,
        propertyAddress
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
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      
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
            <span className="text-slate-400">Not a landlord?</span>
            <button
              onClick={onSwitchToTenant}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline"
            >
              Go to Tenant Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Login / Register Card */}
      <main className="max-w-md w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center">
        
        <div className="bg-slate-800/90 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          {/* Heading */}
          <div className="space-y-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <span>Landlord & Property Manager Portal</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              {isRegister ? 'Register as Property Owner' : 'Landlord Secure Login'}
            </h2>
            <p className="text-xs text-slate-400">
              {isRegister 
                ? 'Create a master landlord account to manage units & tenants'
                : 'Sign in to access rent ledgers, legal agreements & claims'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Credentials Box */}
          {!isRegister && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Landlord Account</span>
                </span>
                <button
                  type="button"
                  onClick={fillDemoLandlord}
                  className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-black hover:bg-amber-400 transition-colors shadow-sm"
                >
                  Autofill Credentials
                </button>
              </div>
              <div className="text-slate-300 font-mono text-[11px]">
                <div>Email: <strong className="text-white">rajesh.landlord@kirayasetu.in</strong></div>
                <div>Pass: <strong className="text-white">password123</strong></div>
              </div>
            </div>
          )}

          {/* Form */}
          {!isRegister ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Landlord Email or Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="rajesh.landlord@kirayasetu.in"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating Landlord...' : 'Sign In to Landlord Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@landlord.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Landlord PAN</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCPS1234F"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white uppercase font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Aadhaar (12 Digits)</label>
                  <input
                    type="text"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    placeholder="9876-5432-1098"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Registering...' : 'Create Landlord Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Toggle Login / Register */}
          <div className="text-center pt-2 border-t border-slate-700/60 text-xs">
            {!isRegister ? (
              <p className="text-slate-400">
                Are you a new property owner?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline"
                >
                  Register Landlord Account
                </button>
              </p>
            ) : (
              <p className="text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Strict Authorization: Tenants cannot authenticate through this Landlord gateway.</span>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>KirayaSetu Landlord Authorization Gateway</p>
      </footer>

    </div>
  );
}
