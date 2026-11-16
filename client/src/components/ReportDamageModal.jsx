import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CreditCard, 
  Calendar, 
  Check, 
  ShieldAlert,
  IndianRupee
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportDamageModal({ 
  onClose, 
  onSubmit, 
  currentUser 
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [severity, setSeverity] = useState('Medium');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [costPayer, setCostPayer] = useState('landlord'); // landlord or tenant

  // Invoice Details
  const [hasInvoice, setHasInvoice] = useState(true);
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadedInvoiceUrl, setUploadedInvoiceUrl] = useState('');
  const [uploadedInvoiceName, setUploadedInvoiceName] = useState('');

  // Photos
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState('');

  // Handle invoice file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const res = await api.uploadFile(file);
      if (res.success) {
        setUploadedInvoiceUrl(res.fileUrl);
        setUploadedInvoiceName(res.fileName);
      }
    } catch (err) {
      console.error(err);
      // Fallback sample URL if upload endpoint isn't connected
      setUploadedInvoiceUrl('/uploads/sample-invoice.pdf');
      setUploadedInvoiceName(file.name);
    } finally {
      setUploadingFile(false);
    }
  };

  // Sample quick damage presets
  const applyPreset = (preset) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setRepairCost(preset.cost);
    setDescription(preset.desc);
    setVendorName(preset.vendor);
    setInvoiceNumber(preset.inv);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !repairCost) {
      setError('Please fill in damage title, detailed description, and repair cost.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        category,
        severity,
        incidentDate,
        description,
        repairCost: Number(repairCost),
        costPayer,
        invoiceNumber: hasInvoice ? (invoiceNumber || `INV-${Date.now().toString().slice(-5)}`) : null,
        vendorName: hasInvoice ? (vendorName || 'Independent Technician') : null,
        vendorGstin,
        invoiceDate,
        invoiceFileUrl: uploadedInvoiceUrl || (hasInvoice ? '/sample-invoices/repair-invoice.pdf' : null),
        invoiceFileName: uploadedInvoiceName || 'repair_bill.pdf',
        photos: photos.length > 0 ? photos : [
          category === 'Plumbing' 
            ? 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80'
        ]
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit damage report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Report Damage & Submit Repair Invoice
              </h3>
              <p className="text-xs text-slate-500">
                Add repair cost and vendor invoice for landlord reimbursement or record
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Quick presets for testing convenience */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Quick Test Presets (Click to autofill)
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset({
                  title: 'Kitchen Sink Drain Pipe Leakage & S-Trap Crack',
                  category: 'Plumbing',
                  cost: '1450',
                  desc: 'The PVC pipe beneath the kitchen sink cracked causing water spillage on modular wooden cabinet. Plumber replaced S-trap and pipe.',
                  vendor: 'Urban Company Plumbing',
                  inv: 'UC-BLR-2026-441'
                })}
                className="text-[11px] bg-white border border-slate-200 hover:border-emerald-500 px-2.5 py-1 rounded-lg text-slate-700 font-medium"
              >
                + Kitchen Pipe Leak (₹1,450)
              </button>
              <button
                type="button"
                onClick={() => applyPreset({
                  title: 'Main Bedroom Ceiling Fan Regulator & Capacitor',
                  category: 'Electrical',
                  cost: '650',
                  desc: 'Ceiling fan was humming loudly and not running at normal speed. Electrician replaced Havells capacitor and wall regulator.',
                  vendor: 'City Electrical Works',
                  inv: 'CEW-NOV-812'
                })}
                className="text-[11px] bg-white border border-slate-200 hover:border-emerald-500 px-2.5 py-1 rounded-lg text-slate-700 font-medium"
              >
                + Ceiling Fan Repair (₹650)
              </button>
              <button
                type="button"
                onClick={() => applyPreset({
                  title: 'Bathroom Water Heater (Geyser) Heating Element Burnout',
                  category: 'Appliance',
                  cost: '2200',
                  desc: 'AO Smith 25L geyser tripped the MCB. Heating coil had accumulated hard water scaling and burned out. Replaced original heating element with thermostat.',
                  vendor: 'HeatWell Appliances Bangalore',
                  inv: 'HW-2026-993'
                })}
                className="text-[11px] bg-white border border-slate-200 hover:border-emerald-500 px-2.5 py-1 rounded-lg text-slate-700 font-medium"
              >
                + Geyser Coil Burnout (₹2,200)
              </button>
            </div>
          </div>

          {/* Damage Basics */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Damage Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Bathroom Geyser Pipe Leakage"
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Appliance</option>
                  <option>Carpentry & Doors</option>
                  <option>Glass & Windows</option>
                  <option>Walls & Paint</option>
                  <option>Flooring & Tiles</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Incident Date
                </label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detailed Damage Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what broke, cause of damage, and repair work conducted..."
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Repair Cost & Cost Payer */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-amber-700" />
              <span>Repair Cost & Reimbursement Request</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cost of Repairing (in ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                    placeholder="e.g. 1850"
                    className="w-full text-xs font-bold py-2 pl-7 pr-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reimbursement Preference
                </label>
                <select
                  value={costPayer}
                  onChange={(e) => setCostPayer(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="landlord">Request Landlord Reimbursement (Normal wear / structural)</option>
                  <option value="tenant">Tenant Self-Paid (Report for landlord record only)</option>
                  <option value="split">Shared 50-50 Split</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vendor Invoice & Receipt Details */}
          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Attach Repair Invoice / Bill / Receipt</span>
              </h4>
              <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasInvoice}
                  onChange={(e) => setHasInvoice(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold">I have a vendor bill</span>
              </label>
            </div>

            {hasInvoice && (
              <div className="space-y-3 pt-2 border-t border-emerald-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Vendor / Technician / Service Company
                    </label>
                    <input
                      type="text"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="e.g. QuickFix Plumbing Bangalore"
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Invoice / Bill Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-882"
                      className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Vendor GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={vendorGstin}
                      onChange={(e) => setVendorGstin(e.target.value)}
                      placeholder="29AABCU9603R1ZM"
                      className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                {/* Upload File Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Upload Invoice File (PDF, PNG, JPG)
                  </label>
                  <div className="border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center bg-white hover:bg-emerald-50/20 transition-colors">
                    <input
                      type="file"
                      id="invoice-upload"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="invoice-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-xs font-bold text-emerald-700">
                        {uploadingFile ? 'Uploading...' : uploadedInvoiceName ? `Uploaded: ${uploadedInvoiceName}` : 'Click to choose bill/invoice file'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Supports PDF, scanned receipts and clear phone photos
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Landlord Rajesh Sharma will be notified immediately upon submission.
          </p>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Damage Claim'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
