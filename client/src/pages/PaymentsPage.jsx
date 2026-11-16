import React, { useState } from 'react';
import { 
  CreditCard, 
  Bell, 
  CheckCircle2, 
  Clock, 
  Printer, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  Building,
  DollarSign
} from 'lucide-react';

export default function PaymentsPage({
  invoices,
  currentUser,
  onOpenPayRent,
  onOpenHraReceipt,
  onSendRentReminders
}) {
  const isAdmin = currentUser?.role === 'admin';
  const [filter, setFilter] = useState('all'); // all, unpaid, paid
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'unpaid') return inv.status === 'unpaid';
    if (filter === 'paid') return inv.status === 'paid';
    return true;
  });

  const handleBroadcastReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await onSendRentReminders();
      setReminderMessage(res?.message || 'Rent reminder notifications dispatched to all tenants!');
      setTimeout(() => setReminderMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReminders(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Rent Collection & Invoices
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Manage monthly rent schedules, pay rent through UPI / NetBanking / Cards with instant receipts, and download HRA compliant rent receipts (Sec 10(13A)) with Landlord PAN.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleBroadcastReminders}
            disabled={sendingReminders}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 transition-all whitespace-nowrap disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            <span>{sendingReminders ? 'Sending Reminders...' : 'Send Rent Reminders to Tenants'}</span>
          </button>
        )}
      </div>

      {reminderMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{reminderMessage}</span>
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
          All Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setFilter('unpaid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === 'unpaid'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unpaid / Due ({invoices.filter(i => i.status === 'unpaid').length})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === 'paid'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Paid Receipts ({invoices.filter(i => i.status === 'paid').length})
        </button>
      </div>

      {/* Invoices Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredInvoices.map((invoice) => {
            const isUnpaid = invoice.status === 'unpaid';
            const isTenantUser = currentUser?.role === 'tenant' && currentUser?.id === invoice.tenantId;

            return (
              <div
                key={invoice.id}
                className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {invoice.invoiceNumber}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {invoice.billingMonth}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      invoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Tenant: <strong>{invoice.tenantName}</strong> • {invoice.unitNumber} ({invoice.propertyName})
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span>Base Rent: <strong>₹{invoice.baseRent?.toLocaleString('en-IN')}</strong></span>
                    <span>•</span>
                    <span>Maintenance: <strong>₹{invoice.maintenanceCharges?.toLocaleString('en-IN')}</strong></span>
                    <span>•</span>
                    <span>Due Date: <strong className="text-slate-800">{invoice.dueDate}</strong></span>
                    {invoice.paidAt && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700">Paid on: <strong>{new Date(invoice.paidAt).toLocaleDateString('en-IN')}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-3 flex-shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
                    <span className="text-xl font-black text-slate-900">
                      ₹{invoice.totalAmount?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isUnpaid ? (
                      <button
                        onClick={() => onOpenPayRent(invoice)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Rent via UPI</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenHraReceipt(invoice)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-slate-200 hover:border-emerald-200"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download HRA Receipt</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
