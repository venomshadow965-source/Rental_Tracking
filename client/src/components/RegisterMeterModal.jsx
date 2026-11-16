import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Droplets, 
  ShieldCheck, 
  Building, 
  FileText, 
  Hash, 
  Gauge
} from 'lucide-react';

export default function RegisterMeterModal({ 
  onClose, 
  onSubmit, 
  currentUser,
  units,
  users 
}) {
  const [meterType, setMeterType] = useState('electricity');
  const [utilityProvider, setUtilityProvider] = useState('BESCOM (Bangalore Electricity Supply Company)');
  const [consumerId, setConsumerId] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [sanctionedLoad, setSanctionedLoad] = useState('3 kW');
  const [phaseType, setPhaseType] = useState('Single Phase Domestic (LT-2)');
  const [initialReading, setInitialReading] = useState('');
  const [governmentDocumentRef, setGovernmentDocumentRef] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState(currentUser?.assignedUnitId || units[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Indian Electricity & Water Boards
  const electricityProviders = [
    'BESCOM (Bangalore Electricity Supply Company)',
    'BSES Rajdhani Power Limited (Delhi)',
    'BSES Yamuna Power Limited (Delhi)',
    'Tata Power (Delhi / Mumbai)',
    'MSEDCL (Mahavitaran Maharashtra)',
    'TNEB (Tamil Nadu Generation and Distribution)',
    'TSSPDCL (Southern Power Distribution Telangana)',
    'UPPCL (Uttar Pradesh Power Corporation)',
    'CESC (Kolkata)'
  ];

  const waterProviders = [
    'BWSSB (Bangalore Water Supply and Sewerage Board)',
    'DJB (Delhi Jal Board)',
    'BMC (Brihanmumbai Municipal Corporation Water)',
    'HMWSSB (Hyderabad Metro Water Supply)',
    'CMWSSB (Chennai Metro Water)',
    'Municipal Corporation Water Works'
  ];

  const handleTypeChange = (type) => {
    setMeterType(type);
    if (type === 'electricity') {
      setUtilityProvider(electricityProviders[0]);
      setSanctionedLoad('3 kW');
      setPhaseType('Single Phase Domestic (LT-2)');
    } else {
      setUtilityProvider(waterProviders[0]);
      setSanctionedLoad('Domestic 1/2 Inch');
      setPhaseType('Domestic Residential');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consumerId || !meterNumber || initialReading === '') {
      setError('Please provide Consumer ID, Meter Number, and Initial Meter Reading.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        meterType,
        utilityProvider,
        consumerId,
        meterNumber,
        sanctionedLoad,
        phaseType,
        initialReading: Number(initialReading),
        unitId: selectedUnitId,
        tenantId: currentUser?.role === 'tenant' ? currentUser.id : 'usr_tenant_1',
        governmentDocumentRef: governmentDocumentRef || `GOV-SANCTION-${consumerId}`
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register government meter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${meterType === 'electricity' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
              {meterType === 'electricity' ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Register Government Allotted Meter
              </h3>
              <p className="text-xs text-slate-500">
                Link official electricity or water meter for tracking monthly bills
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Meter Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Meter Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('electricity')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border transition-all ${
                  meterType === 'electricity'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-xs">Electricity Meter</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('water')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border transition-all ${
                  meterType === 'water'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Droplets className="w-4 h-4 text-blue-600" />
                <span className="text-xs">Water Meter</span>
              </button>
            </div>
          </div>

          {/* Utility Provider / Discom */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Government Utility Board / Provider *
            </label>
            <select
              value={utilityProvider}
              onChange={(e) => setUtilityProvider(e.target.value)}
              className="w-full text-xs font-medium py-2 px-3 border border-slate-300 rounded-lg bg-white"
            >
              {(meterType === 'electricity' ? electricityProviders : waterProviders).map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* Consumer ID & Meter Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consumer ID / CA / RR No. *
              </label>
              <input
                type="text"
                required
                value={consumerId}
                onChange={(e) => setConsumerId(e.target.value)}
                placeholder={meterType === 'electricity' ? 'e.g. 88472910' : 'e.g. BW-KOR-302'}
                className="w-full text-xs font-mono font-bold py-2 px-3 border border-slate-300 rounded-lg bg-white"
              />
              <span className="text-[10px] text-slate-400">Printed on your monthly utility bill</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Physical Meter Serial No. *
              </label>
              <input
                type="text"
                required
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="e.g. KA-BES-2024-991"
                className="w-full text-xs font-mono font-bold py-2 px-3 border border-slate-300 rounded-lg bg-white"
              />
              <span className="text-[10px] text-slate-400">Engraved on physical meter casing</span>
            </div>
          </div>

          {/* Sanctioned Load & Initial Reading */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sanctioned Load / Pipe Spec
              </label>
              <input
                type="text"
                value={sanctionedLoad}
                onChange={(e) => setSanctionedLoad(e.target.value)}
                placeholder="e.g. 3 kW or 1/2 Inch"
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Initial Meter Reading ({meterType === 'electricity' ? 'kWh' : 'kL'}) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={initialReading}
                onChange={(e) => setInitialReading(e.target.value)}
                placeholder="e.g. 1200"
                className="w-full text-xs font-bold py-2 px-3 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Associated Unit & Gov Sanction Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Property Unit
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
              >
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.number} ({u.propertyName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gov Sanction Ref (Optional)
              </label>
              <input
                type="text"
                value={governmentDocumentRef}
                onChange={(e) => setGovernmentDocumentRef(e.target.value)}
                placeholder="BESCOM-SANCTION-2026"
                className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Once registered, monthly readings will automatically generate slab bills with historical trends.</span>
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Government Meter'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
