import React, { useState } from 'react';
import { 
  X, 
  Gauge, 
  Zap, 
  Droplets, 
  Calendar, 
  CreditCard,
  Calculator
} from 'lucide-react';

export default function AddReadingModal({ 
  meters, 
  onClose, 
  onSubmit 
}) {
  const [selectedMeterId, setSelectedMeterId] = useState(meters[0]?.id || '');
  const selectedMeter = meters.find(m => m.id === selectedMeterId) || meters[0];

  const [billingMonth, setBillingMonth] = useState('December 2026');
  const prevReading = selectedMeter?.currentReading || selectedMeter?.initialReading || 0;
  const [currentReading, setCurrentReading] = useState(prevReading + (selectedMeter?.meterType === 'electricity' ? 140 : 15));
  const [ratePerUnit, setRatePerUnit] = useState(selectedMeter?.meterType === 'electricity' ? 7.5 : 24);
  const [fixedCharges, setFixedCharges] = useState(selectedMeter?.meterType === 'electricity' ? 120 : 45);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMeterChange = (meterId) => {
    setSelectedMeterId(meterId);
    const m = meters.find(meter => meter.id === meterId);
    if (m) {
      const p = m.currentReading || m.initialReading || 0;
      setRatePerUnit(m.meterType === 'electricity' ? 7.5 : 24);
      setFixedCharges(m.meterType === 'electricity' ? 120 : 45);
      setCurrentReading(p + (m.meterType === 'electricity' ? 140 : 15));
    }
  };

  const unitsConsumed = Math.max(0, Number(currentReading) - prevReading);
  const totalAmount = Math.round(unitsConsumed * Number(ratePerUnit) + Number(fixedCharges));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(currentReading) < prevReading) {
      setError(`Current reading cannot be lower than previous reading (${prevReading})`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        meterId: selectedMeterId,
        billingMonth,
        currentReading: Number(currentReading),
        ratePerUnit: Number(ratePerUnit),
        fixedCharges: Number(fixedCharges),
        dueDate,
        notes: notes || `Recorded monthly meter reading for ${selectedMeter?.meterType}.`
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record meter reading');
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
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Record Monthly Meter Reading & Generate Bill
              </h3>
              <p className="text-xs text-slate-500">
                Auto-calculates units consumed and monthly tariff
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

          {/* Select Meter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Registered Meter
            </label>
            <select
              value={selectedMeterId}
              onChange={(e) => handleMeterChange(e.target.value)}
              className="w-full text-xs font-medium py-2 px-3 border border-slate-300 rounded-lg bg-white"
            >
              {meters.map(m => (
                <option key={m.id} value={m.id}>
                  {m.meterType.toUpperCase()}: {m.utilityProvider.split(' ')[0]} ({m.consumerId}) - {m.unitNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Billing Month
            </label>
            <input
              type="text"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              placeholder="e.g. December 2026"
              className="w-full text-xs font-bold py-2 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          {/* Readings */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Previous Reading</span>
              <div className="text-lg font-mono font-bold text-slate-700 mt-0.5">
                {prevReading} {selectedMeter?.meterType === 'electricity' ? 'kWh' : 'kL'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-0.5">
                Current Reading *
              </label>
              <input
                type="number"
                required
                min={prevReading}
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                className="w-full text-xs font-mono font-bold py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Total Units Consumed:</span>
              <span className="font-mono font-black text-emerald-800 text-sm bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {unitsConsumed} {selectedMeter?.meterType === 'electricity' ? 'Units (kWh)' : 'kL'}
              </span>
            </div>
          </div>

          {/* Rates & Charges */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rate Per Unit (₹)
              </label>
              <input
                type="number"
                step="0.1"
                value={ratePerUnit}
                onChange={(e) => setRatePerUnit(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fixed Meter Charges (₹)
              </label>
              <input
                type="number"
                value={fixedCharges}
                onChange={(e) => setFixedCharges(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bill Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          {/* Computed Bill Total Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-bold">Total Bill Amount</span>
              <div className="text-2xl font-black">₹{totalAmount.toLocaleString('en-IN')}</div>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">
              Unpaid (Due: {dueDate})
            </span>
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
              {loading ? 'Saving...' : 'Record Reading & Generate Bill'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
